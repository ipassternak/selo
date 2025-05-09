export enum GameVersionSortColumn {
  VersionId = 'versionId',
  ReleasedAt = 'releasedAt',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export enum GameVersionParseType {
  Manifest = 'manifest',
}

export enum GameVersionParseSourceType {
  Url = 'url',
  File = 'file',
}

export interface GameVersionManifestLatest {
  release: string;
  snapshot: string;
}

export interface GameVersionManifestItem {
  id: string;
  type: string;
  url: string;
  time: Date;
  releaseTime: Date;
}

export interface GameVersionManifest {
  latest: GameVersionManifestLatest;
  versions: GameVersionManifestItem[];
}
