import * as dotenv from "dotenv";
import YoutubeUploader, { UploadVideoInput, UploadVideoOptions } from "..";
dotenv.config();

const youtubeUploader = new YoutubeUploader(
  process.env.YOUTUBE_CHANNEL_ID!,
  process.env.COOKIE_PATH!,
  "ko",
  {
    headless: false,
  },
  true
);

(async () => {
  await youtubeUploader.init();
  const uploadInput: UploadVideoInput = {
    title: "Title",
    description: `Description`,
    tags: ["Tag1", "Tag2"],
    // thumbnailPath: "thumbnail.jpg",
    videoPath: "video.mp4",
    visibility: "private",
    // schedule: new Date(new Date().setMinutes(55)),
    playlist: ["playlist1", "playlist2"],
  };
  const uploadOptions: UploadVideoOptions = {
    notifySubscribers: false,
  };
  await youtubeUploader.uploadVideo(uploadInput, uploadOptions);

  await youtubeUploader.uploadBulkVideos([
    { input: uploadInput, options: uploadOptions },
    { input: uploadInput, options: uploadOptions },
  ]);
})();
