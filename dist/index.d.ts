/// <reference types="node" />
import * as readline from "readline/promises";
import { BrowserContext, LaunchOptions, Page } from "playwright";
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
} & ({
    visibility?: "public" | "unlisted" | "private";
    schedule?: never;
} | {
    visibility?: never;
    schedule?: Date;
});
export type UploadVideoOptions = {
    notifySubscribers?: boolean;
};
export default class YoutubeUploader {
    private channelId;
    private cookiePath;
    rl: readline.Interface;
    browserContext: BrowserContext | undefined;
    page: Page | undefined;
    isLunch: boolean;
    isInit: boolean;
    launchOptions: LaunchOptions;
    youtubeLocales: string;
    isDev: boolean;
    constructor(channelId: string, cookiePath: string, youtubeLocales?: string, launchOptions?: LaunchOptions, isDev?: boolean);
    private launchPage;
    private getCookie;
    private setCookie;
    init: () => Promise<void>;
    private checkInit;
    private fileChoose;
    private existClick;
    private existFill;
    private setDetailsTab;
    private getVideoId;
    private setMonetizeTab;
    private getIntlFormatDateTime;
    private setVisibilityTab;
    uploadVideo: (input: UploadVideoInput, options?: UploadVideoOptions) => Promise<string | undefined>;
    uploadBulkVideos: (inputs: UploadBulkVideoInput) => Promise<void>;
}
