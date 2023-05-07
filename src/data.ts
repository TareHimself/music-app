export default class AppConstants {
  static AUDIO_PLAYER_ID = "audio-player";
  static NAV_ID_LIBRARY = "/library";
  static NAV_ID_SETTINGS = "/settings";
  static NAV_ID_VISUALIZER = "/visualizer";
  static NAV_ID_QUEUE = "/queue";
  static MAIN_NAV_IDS = [
    AppConstants.NAV_ID_LIBRARY,
    AppConstants.NAV_ID_SETTINGS,
    AppConstants.NAV_ID_VISUALIZER,
  ];
  static DEFAULT_COVER_ART = "assets/default-cover.png";
  static UNAVAILABLE_FEATURE_ERROR = "This feature is not yet available";
  static RENDERER_EVENT_QUEUE_TRACKS = "tracks/queue";
  static RENDERER_EVENT_PLAY_LATER = "tracks/queue/later";
  static RENDERER_EVENT_PLAY_NEXT = "tracks/queue/next";
  static RENDERER_EVENT_SKIP_TO_INDEX = "tracks/skip/index";
}
