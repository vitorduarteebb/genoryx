"use client";
import { CreatureGxrFigure } from "./creature-gxr-figure";
import type { CreatureVisualInput } from "../lib/creature-visual-contract";
export type CreatureModelViewerProps = CreatureVisualInput & {url:string;portraitUrl?:string|null;bodyPlan?:string|null;mutation?:string|null;className?:string};
export function CreatureModelViewer({url,className="",context="PROFILE",...input}:CreatureModelViewerProps) {
  return <div className={`creature-inspect ${className}`} style={{display:"grid",placeItems:"center"}}>
    <CreatureGxrFigure {...input} modelUrl={url} context={context} size={520} />
  </div>;
}
