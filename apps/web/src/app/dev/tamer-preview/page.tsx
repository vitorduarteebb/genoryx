import { notFound } from "next/navigation";
import { EditorPreview } from "./preview";
export const dynamic="force-dynamic";
export default function Page(){if(process.env.NODE_ENV==="production"&&process.env.CREATURE_VISUAL_LAB!=="1")notFound();return <EditorPreview/>;}
