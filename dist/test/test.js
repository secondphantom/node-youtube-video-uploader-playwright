"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const __1 = __importDefault(require(".."));
dotenv.config();
const youtubeUploader = new __1.default(process.env.YOUTUBE_CHANNEL_ID, process.env.COOKIE_PATH, "ko", {
    headless: false,
}, true);
(async () => {
    await youtubeUploader.init();
    const uploadInput = {
        title: "Title",
        description: `Description`,
        tags: ["Tag1", "Tag2"],
        // thumbnailPath: "thumbnail.jpg",
        videoPath: "video.mp4",
        visibility: "private",
        // schedule: new Date(new Date().setMinutes(55)),
        playlist: ["playlist1", "playlist2"],
    };
    const uploadOptions = {
        notifySubscribers: false,
    };
    await youtubeUploader.uploadVideo(uploadInput, uploadOptions);
    await youtubeUploader.uploadBulkVideos([
        { input: uploadInput, options: uploadOptions },
        { input: uploadInput, options: uploadOptions },
    ]);
})();
