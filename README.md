# youtube-video-uploader-playwright

This library support uploading videos on youtube by playwright.

- [youtube-video-uploader-playwright](#youtube-video-uploader-playwright)
	- [Introduction](#introduction)
	- [Usage](#usage)
		- [New Class](#new-class)
		- [Init Uploader](#init-uploader)
		- [Upload Input](#upload-input)
		- [Upload Video](#upload-video)

## Introduction
The YouTube Data API default quota is 10000 points. And the upload video API consumes 1600 points. 
The default quota was too small, so I considered uploading a video to a 'crawler'.
## Usage
***Please add .gitignore for 'cookie' path.***
### New Class
- `launch options` headless false recommend
```ts
const youtubeUploader = new YoutubeUploader(
	// Input your channel id
  'youtubeChannelId',
	// Please add .gitignore for 'cookie' path.
  '/path/cookies.json', 
	// input your youtube locales for schedule
	// default is 'en'
  "ko",
	// Playwright launch options 
  {
		// headless false recommend.
    headless: false,
  },
	// isDev check
  true
);
```

### Init Uploader
- If you initialize the `YoutubeUploader` class for the first time, you should get JSON cookies for your YouTube channel.
- When you first run the `init` method, the browser automatically opens for YouTube login. If you are logged in to a YouTube channel, type 'y' in `CLI`.
```ts
await youtubeUploader.init();
```
### Upload Input
- `title` and `videoPath` are required. other is optional
```ts
const uploadInput: UploadVideoInput = {
	title: "Title", 
	videoPath: "video.mp4", 
	/*
	* below optional 
	*/
	description: `Description`,
	tags: ["Tag1", "Tag2"],
	thumbnailPath: "thumbnail.jpg",
	/*
	* You can enter either the 'visibility' option or the 'schedule' option.
	*/
	visibility: "private", // ""public" | "unlisted" | "private"
	schedule: new Date(new Date().setMinutes(55)),
	playlist: ["playlist1", "playlist2"],
};
// optional
const uploadOptions: UploadVideoOptions = {
	notifySubscribers: false,
};
```
### Upload Video
```ts
// return video id 
await youtubeUploader.uploadVideo(uploadInput, uploadOptions).then(console.log);
// ["videoId","videoIds"]

// return video ids and fail inputs
await youtubeUploader.uploadBulkVideos([
	{ input: uploadInput, options: uploadOptions }, // input_1
	{ input: uploadInput, options: uploadOptions }, // input_2
]).then(console.log);
	// { videoIds: ["videoId"], failInputs: [input_2] }
```
