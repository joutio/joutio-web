/** Réponse de `/version.json`, émis au build par `vite.config.ts`. */
export interface AppVersionInfo {
  version?: string
  buildId?: string
}

/** Un build distant différent du build chargé = une nouvelle version est disponible. */
export function isStaleBuild(
  remote: AppVersionInfo | null,
  currentBuildId: string
): boolean {
  return remote?.buildId != null && remote.buildId !== currentBuildId
}
