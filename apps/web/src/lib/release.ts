export const releaseChannel = process.env.NEXT_PUBLIC_RELEASE_CHANNEL ?? "dev";
export const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "local";
export const isAlpha = releaseChannel === "alpha";
