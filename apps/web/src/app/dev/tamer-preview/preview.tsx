"use client";
import { useState } from "react";
import { parseCharacterAppearance } from "@nexora/config";
import { TamerEditor } from "../../../components/tamer-editor";
export function EditorPreview(){const [value,setValue]=useState(()=>parseCharacterAppearance({hairId:"hair_04_tied",capeId:"cape_short_explorer",backId:"back_explorer_pack"}));return <main className="mx-auto max-w-5xl p-8"><h1 className="mb-5 text-2xl text-gold">Treinador — prévia local</h1><TamerEditor value={value} onChange={setValue}/><p className="mt-4 text-muted">Esta prévia não salva dados. No jogo, use Aparência para salvar na sua conta.</p></main>;}
