export interface SpotifyExternalObject {
  spotifyUrl: string;
  spotifyUri: string;
}

export interface SpotifySearchResponse {
  tracks: SpotifyExternalObject[];
  albums: SpotifyExternalObject[];
  artists: SpotifyExternalObject[];
}

export interface SpotifyTopResponse {
  shortTerm: SpotifyExternalObject[];
  mediumTerm: SpotifyExternalObject[];
  longTerm: SpotifyExternalObject[];
}
