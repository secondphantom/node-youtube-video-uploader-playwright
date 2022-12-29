import fs from "fs";
import path from "path";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import {
  BrowserContext,
  chromium,
  ElementHandle,
  LaunchOptions,
  Page,
} from "playwright";

const delay = (ms: number, res?: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(res);
    }, ms);
  });
};

type PickUndefinedAble<T> = {
  [key in keyof T as undefined extends T[key] ? key : never]: T[key];
};

export type UploadBulkVideoInput = {
  input: UploadVideoInput;
  options?: UploadVideoOptions;
}[];

export type UploadVideoInput = {
  videoPath: string;
  thumbnailPath?: string;
  title: string;
  description?: string;
  playlist?: string[];
  tags?: string[];
} & (
  | {
      visibility?: "public" | "unlisted" | "private";
      schedule?: never;
    }
  | {
      visibility?: never;
      schedule?: Date;
    }
);

export type UploadVideoOptions = {
  notifySubscribers?: boolean;
};

export default class YoutubeUploader {
  rl = readline.createInterface({ input, output });
  browserContext: BrowserContext | undefined;
  page: Page | undefined;
  isLunch = false;
  isInit = false;
  launchOptions: LaunchOptions;
  youtubeLocales: string;
  isDev: boolean;

  constructor(
    private channelId: string,
    private cookiePath: string,
    youtubeLocales?: string,
    launchOptions?: LaunchOptions,
    isDev?: boolean
  ) {
    this.isDev = isDev === undefined ? false : isDev;
    this.youtubeLocales = youtubeLocales === undefined ? "en" : youtubeLocales;
    this.launchOptions = {
      ...(launchOptions === undefined ? {} : launchOptions),
      ignoreDefaultArgs: [
        "--disable-component-extensions-with-background-pages",
      ],
      args: ["--disable-blink-features=AutomationControlled"],
    };
  }

  private launchPage = async () => {
    const browser = await chromium.launch(this.launchOptions);
    this.browserContext = await browser.newContext();
    this.page = await this.browserContext.newPage();
    this.isLunch = true;
  };

  private getCookie = async () => {
    await this.launchPage();
    if (!this.page) throw new Error("Cannot launched browser page");
    await this.page.goto("https://www.youtube.com", { waitUntil: "load" });

    const loginRecur = async () => {
      const loginYoutube = await this.rl.question(
        "Login youtube channel. Did you login? (y/n)\n"
      );
      switch (loginYoutube.toLocaleLowerCase()) {
        case "n":
          console.info("Need login to get cookies about youtube");
          await loginRecur();
          break;
        case "y":
          break;
        default:
          await loginRecur();
          break;
      }
      return;
    };
    await loginRecur();

    const cookies = await this.browserContext!.cookies(
      "https://www.youtube.com"
    );
    await fs.promises.writeFile(this.cookiePath, JSON.stringify(cookies));
  };

  private setCookie = async () => {
    const cookies = await fs.promises
      .readFile(this.cookiePath, { encoding: "utf-8" })
      .then(JSON.parse);
    await this.browserContext!.addCookies(cookies);
  };

  init = async () => {
    if (!fs.existsSync(this.cookiePath)) {
      const tempLaunchOptions = JSON.parse(JSON.stringify(this.launchOptions));
      this.launchOptions.headless = false;
      await this.getCookie();
      this.isLunch = false;
      this.launchOptions = tempLaunchOptions;
      this.browserContext?.close();
    }
    if (!this.isLunch) await this.launchPage();
    await this.setCookie();
    await this.page!.goto(
      `https://studio.youtube.com/channel/${this.channelId}`,
      { waitUntil: "load" }
    ).then(async () => {
      await delay(3000);
    });
    this.isInit = true;
  };

  private checkInit = () => {
    if (!this.isInit)
      throw new Error(`Need Run 'init' class method before run other method`);
  };

  private fileChoose = async (querySelector: string, filePath: string) => {
    const fileChooserPromise = this.page!.waitForEvent("filechooser");
    await this.existClick(querySelector);
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  };

  private existClick = async (
    querySelector: string,
    delayMs = 500,
    maxTryCount?: number
  ) => {
    if (maxTryCount === undefined) maxTryCount = Infinity;
    let tryCount = 0;
    while (true) {
      const btnEle = await this.page!.$(querySelector);
      if (btnEle !== null) {
        await btnEle.click();
        break;
      }
      ++tryCount;
      if (tryCount >= maxTryCount) break;
      await delay(delayMs);
      if (this.isDev) console.log("existClick delayed", querySelector);
    }
  };

  private existFill = async (
    querySelector: string,
    inputStr: string,
    delayMs = 500
  ) => {
    while (true) {
      const inputEle = await this.page!.$(querySelector);
      if (inputEle !== null) {
        await inputEle.fill(inputStr);
        break;
      }
      await delay(delayMs);
      if (this.isDev) console.log("existFill delayed", querySelector);
    }
  };

  private setDetailsTab = async (
    input: UploadVideoInput,
    options?: UploadVideoOptions
  ) => {
    const { title, thumbnailPath, description, playlist, tags } = input;

    await this.existFill("#title-textarea #child-input #textbox", title);

    if (description !== undefined) {
      await this.existFill(
        "#description-textarea #child-input #textbox",
        description
      );
    }

    if (thumbnailPath !== undefined) {
      await this.fileChoose("#add-photo-icon", thumbnailPath);
    }

    if (playlist && playlist.length > 0) {
      await this.existClick(
        'ytcp-video-metadata-editor-basics [icon="icons:arrow-drop-down"]'
      );
      let curPlayListEle: ElementHandle<SVGElement | HTMLElement>[];
      let tryCount = 0;
      const mayTryCount = 10;
      while (true) {
        curPlayListEle = await this.page!.$$(
          "#playlists-list #items .checkbox-label span.ytcp-checkbox-group"
        );
        if (curPlayListEle.length !== 0) break;
        ++tryCount;
        if (tryCount >= mayTryCount) break;
        await delay(1000);
      }
      for (const playlistName of playlist) {
        let isFind = false;
        for (const ele of curPlayListEle) {
          const curPlayListName = await ele.innerText();

          if (curPlayListName !== playlistName) continue;
          await ele.click();
          isFind = true;
          break;
        }
        if (isFind) continue;
        await this.existClick(".new-playlist-button");
        await this.existFill("#create-playlist-form textarea", playlistName);
        await this.existClick(".create-playlist-button");
      }

      await this.existClick(`.done-button.ytcp-playlist-dialog`);
    }
    await this.existClick("ytcp-video-metadata-editor #toggle-button");
    if (tags && tags.length > 0) {
      await this.existFill("#chip-bar #text-input", tags.join(","));
    }

    if (!options) return;
    const { notifySubscribers } = options;
    if (notifySubscribers !== undefined) {
      if (!notifySubscribers) {
        await this.existClick("#notify-subscribers");
      }
    }
  };

  private getVideoId = async () => {
    let videoId = "";
    while (true) {
      const rawUrl = await (await this.page!.$(
        ".ytcp-video-info a"
      ))!.getAttribute("href");
      if (rawUrl) {
        videoId = rawUrl.match(/\/\/(.+)\/(.+)/)![2];
        break;
      }
      await delay(1000);
    }

    return videoId;
  };

  private setMonetizeTab = async () => {
    const monetizeBtn = await this.page!.$(`[test-id="MONETIZATION"]`);

    if (monetizeBtn === null) return;
    await this.existClick('[test-id="MONETIZATION"]');
    await this.existClick(
      '.ytpp-video-monetization-basics [icon="icons:arrow-drop-down"]'
    );
    await this.existClick("#radio-on");
    await this.existClick(".ytcp-video-monetization-edit-dialog #save-button");

    await this.existClick(`[test-id="CONTENT_RATINGS"]`);
    await this.existClick(
      ".ytpp-self-certification-questionnaire #checkbox-container"
    );

    while (true) {
      const ariaDisabled = await (await this.page!.$(
        "#submit-questionnaire-button"
      ))!.getAttribute("aria-disabled");
      if (ariaDisabled === "false") break;
      await delay(500);
    }

    await this.existClick("#submit-questionnaire-button");

    while (true) {
      const disabled = await (await this.page!.$(
        ".ytcp-uploads-content-ratings"
      ))!.getAttribute("disabled");
      if (disabled === null) break;
      await delay(500);
    }
  };

  private getIntlFormatDateTime = (schedule: Date) => {
    // const hour = schedule.getHours();
    // const min = schedule.getMinutes();
    // if (min > 30) {
    //   schedule.setHours(hour + 1);
    //   schedule.setMinutes(0);
    // } else if (min > 0 && min < 30) {
    //   schedule.setMinutes(30);
    // }
    if (schedule <= new Date())
      throw new Error("need schedule time in the future.");
    const dateFormat = new Intl.DateTimeFormat(this.youtubeLocales, {
      dateStyle: "medium",
    });
    const timeFormat = new Intl.DateTimeFormat(this.youtubeLocales, {
      timeStyle: "short",
    });
    const scheduleDate = dateFormat.format(schedule);
    const scheduleTime = timeFormat.format(schedule);
    return {
      scheduleDate,
      scheduleTime,
    };
  };

  private setVisibilityTab = async (input: UploadVideoInput) => {
    const { visibility, schedule } = input;
    await this.existClick('[test-id="REVIEW"]');
    if (visibility !== undefined) {
      if (visibility === "private") {
        await this.existClick('tp-yt-paper-radio-button[name="PRIVATE"]');
      } else if (visibility === "unlisted") {
        await this.existClick('tp-yt-paper-radio-button[name="UNLISTED"]');
      } else if (visibility === "public") {
        await this.existClick('tp-yt-paper-radio-button[name="PUBLIC"]');
      }
    }

    if (schedule !== undefined) {
      const { scheduleDate, scheduleTime } =
        this.getIntlFormatDateTime(schedule);
      await this.existClick("#schedule-radio-button");
      await this.existClick("#datepicker-trigger");
      await this.existFill(
        ".ytcp-date-picker .tp-yt-paper-input input",
        scheduleDate
      );
      await this.page!.keyboard.down("Enter");
      await this.existFill(
        ".ytcp-datetime-picker .tp-yt-paper-input input",
        scheduleTime
      );
      await this.page!.keyboard.down("Enter");
    }
  };

  uploadVideo = async (
    input: UploadVideoInput,
    options?: UploadVideoOptions
  ) => {
    this.checkInit();
    const { videoPath } = input;

    await this.existClick("#create-icon");
    await this.existClick("#text-item-0");
    await this.fileChoose("#select-files-button", videoPath);

    await this.setDetailsTab(input, options);
    const videoId = await this.getVideoId();
    await this.setMonetizeTab();
    await this.setVisibilityTab(input);

    await this.existClick("#done-button");
    await this.existClick(
      "ytcp-prechecks-warning-dialog #primary-action-button",
      1000,
      10
    );
    await this.existClick(
      ".ytcp-uploads-still-processing-dialog #close-button",
      1000,
      60
    );
    return videoId;
  };

  uploadBulkVideos = async (inputs: UploadBulkVideoInput) => {
    const videoIds: string[] = [];
    const failInputs: UploadBulkVideoInput[] = [];
    for (const { input, options } of inputs) {
      await this.uploadVideo(input, options)
        .then((videoId) => {
          videoIds.push(videoId);
        })
        .catch((e) => {
          console.log(e);
          failInputs.push(inputs);
        });
    }
    return {
      videoIds,
      failInputs,
    };
  };
}
