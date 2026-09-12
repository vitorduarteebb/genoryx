import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matDir = path.join(root, "Assets/GENORYX/Materials");
const scenePath = path.join(root, "Assets/GENORYX/Scenes/HavenSlice.unity");

const MESH = {
  Cube: 10202,
  Sphere: 10207,
  Capsule: 10208,
  Cylinder: 10206,
};
const BUILTIN = "0000000000000000e000000000000000";
const GUIDS = {
  PlayerMotor: "8438b6ecf7665184997a06d0a9f92b27",
  PlayerBeacon: "9b39c9d160a3bce43bbf9f37b2e0f595",
  CompanionFollower: "7606eb0fc58483548b950fe416c39891",
  WorldCameraRig: "94f1b5d187aa1e946865da4a81e4a544",
  WorldBridge: "d087501a87a4af54a9b518772c4a0319",
  WorldHud: "78f67edac74586b428c567e895324a61",
  NpcActor: "d9871ffe4b34030498bc99436fe32806",
  URPLight: "474bcb49853aa07438625e644c072ee6",
  URPCamera: "a79441f348de89743a2939f4d699eac1",
};

const colors = {
  plaza: [0.48, 0.46, 0.42],
  wear: [0.4, 0.36, 0.3],
  roadA: [0.38, 0.32, 0.26],
  roadB: [0.44, 0.38, 0.3],
  core: [0.28, 0.42, 0.46],
  shard: [0.45, 0.92, 0.88],
  houseE: [0.62, 0.56, 0.48],
  houseW: [0.55, 0.5, 0.46],
  roof: [0.42, 0.22, 0.2],
  stall: [0.46, 0.32, 0.18],
  cloth: [0.78, 0.62, 0.22],
  shrine: [0.72, 0.55, 0.78],
  pole: [0.25, 0.2, 0.18],
  banner: [0.72, 0.22, 0.22],
  trunk: [0.28, 0.2, 0.14],
  canopy: [0.18, 0.32, 0.2],
  stone: [0.5, 0.48, 0.44],
  pillar: [0.46, 0.44, 0.4],
  ridge: [0.14, 0.22, 0.16],
  player: [0.72, 0.58, 0.4],
  pyron: [0.92, 0.42, 0.22],
  theo: [0.82, 0.68, 0.32],
  kael: [0.38, 0.62, 0.72],
  lyra: [0.78, 0.46, 0.62],
  guard: [0.45, 0.42, 0.4],
  guardB: [0.4, 0.38, 0.36],
  adventurer: [0.42, 0.5, 0.34],
};

function guidFrom(name) {
  return crypto.createHash("md5").update(`genoryx-mat-${name}`).digest("hex");
}

function matYaml(name, rgb) {
  const [r, g, b] = rgb;
  return `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &-8081582795363580827
MonoBehaviour:
  m_ObjectHideFlags: 11
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: d0353a89b1f911e48b9e16bdc9f2e058, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
  version: 10
--- !u!21 &2100000
Material:
  serializedVersion: 8
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_Name: ${name}
  m_Shader: {fileID: 4800000, guid: 933532a4fcc9baf4fa0491de14d08ed7, type: 3}
  m_Parent: {fileID: 0}
  m_ModifiedSerializedProperties: 0
  m_ValidKeywords: []
  m_InvalidKeywords: []
  m_LightmapFlags: 4
  m_EnableInstancingVariants: 0
  m_DoubleSidedGI: 0
  m_CustomRenderQueue: 2000
  stringTagMap:
    RenderType: Opaque
  disabledShaderPasses:
  - MOTIONVECTORS
  m_LockedProperties: 
  m_SavedProperties:
    serializedVersion: 3
    m_TexEnvs: []
    m_Ints: []
    m_Floats:
    - _Smoothness: 0.28
    - _Metallic: 0.08
    - _Surface: 0
    - _Cull: 2
    - _ZWrite: 1
    - _SrcBlend: 1
    - _DstBlend: 0
    - _AlphaClip: 0
    m_Colors:
    - _BaseColor: {r: ${r}, g: ${g}, b: ${b}, a: 1}
    - _Color: {r: ${r}, g: ${g}, b: ${b}, a: 1}
    - _EmissionColor: {r: 0, g: 0, b: 0, a: 1}
  m_BuildTextureStacks: []
  m_AllowLocking: 1
`;
}

function eulerToQuat(xDeg, yDeg, zDeg) {
  const x = (xDeg * Math.PI) / 180;
  const y = (yDeg * Math.PI) / 180;
  const z = (zDeg * Math.PI) / 180;
  const cx = Math.cos(x * 0.5);
  const sx = Math.sin(x * 0.5);
  const cy = Math.cos(y * 0.5);
  const sy = Math.sin(y * 0.5);
  const cz = Math.cos(z * 0.5);
  const sz = Math.sin(z * 0.5);
  // Unity Quaternion.Euler: z, then x, then y
  return {
    x: +(sx * cy * cz + cx * sy * sz).toFixed(7),
    y: +(cx * sy * cz - sx * cy * sz).toFixed(7),
    z: +(cx * cy * sz - sx * sy * cz).toFixed(7),
    w: +(cx * cy * cz + sx * sy * sz).toFixed(7),
  };
}

function rotateOffset(pitch, yaw, distance) {
  const q = eulerToQuat(pitch, yaw, 0);
  const vx = 0;
  const vy = 0;
  const vz = -distance;
  const ix = q.w * vx + q.y * vz - q.z * vy;
  const iy = q.w * vy + q.z * vx - q.x * vz;
  const iz = q.w * vz + q.x * vy - q.y * vx;
  const iw = -q.x * vx - q.y * vy - q.z * vz;
  return {
    x: +(ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y).toFixed(4),
    y: +(iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z).toFixed(4),
    z: +(iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x).toFixed(4),
  };
}

let nextId = 100000;
const blocks = [];
const roots = [];
const named = {};

function id() {
  return nextId++;
}

function push(text) {
  blocks.push(text);
}

function writeScripts(go, scripts) {
  const ids = [];
  for (const script of scripts) {
    const sid = id();
    ids.push(sid);
    push(`--- !u!114 &${sid}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${script.guid}, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
${script.fields || ""}`);
  }
  return ids;
}

function empty(name, pos = [0, 0, 0], euler = [0, 0, 0], parent = 0, scripts = []) {
  const go = id();
  const tr = id();
  const scriptIds = scripts.map(() => id());
  const q = eulerToQuat(euler[0], euler[1], euler[2]);
  named[name] = { go, tr, scripts: scriptIds };
  if (!parent) roots.push(tr);
  const comps = [`  - component: {fileID: ${tr}}`, ...scriptIds.map((s) => `  - component: {fileID: ${s}}`)].join("\n");
  push(`--- !u!1 &${go}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
${comps}
  m_Layer: 0
  m_Name: ${name}
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &${tr}
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  serializedVersion: 2
  m_LocalRotation: {x: ${q.x}, y: ${q.y}, z: ${q.z}, w: ${q.w}}
  m_LocalPosition: {x: ${pos[0]}, y: ${pos[1]}, z: ${pos[2]}}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_ConstrainProportionsScale: 0
  m_Children: []
  m_Father: {fileID: ${parent}}
  m_LocalEulerAnglesHint: {x: ${euler[0]}, y: ${euler[1]}, z: ${euler[2]}}
`);
  scripts.forEach((script, i) => {
    push(`--- !u!114 &${scriptIds[i]}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${script.guid}, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
${script.fields || ""}`);
  });
  return { go, tr, scripts: scriptIds };
}

function primitive(name, type, pos, scale, matKey, euler = [0, 0, 0], parent = 0, scripts = []) {
  const go = id();
  const tr = id();
  const mf = id();
  const mr = id();
  const col = id();
  const scriptIds = scripts.map(() => id());
  const q = eulerToQuat(euler[0], euler[1], euler[2]);
  const mesh = MESH[type];
  const matGuid = guidFrom(matKey);
  named[name] = { go, tr, scripts: scriptIds };
  if (!parent) roots.push(tr);
  const colliderType = type === "Sphere" ? 135 : type === "Capsule" || type === "Cylinder" ? 136 : 65;
  push(`--- !u!1 &${go}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
  - component: {fileID: ${tr}}
  - component: {fileID: ${mf}}
  - component: {fileID: ${mr}}
  - component: {fileID: ${col}}
${scriptIds.map((s) => `  - component: {fileID: ${s}}`).join("\n")}
  m_Layer: 0
  m_Name: ${name}
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &${tr}
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  serializedVersion: 2
  m_LocalRotation: {x: ${q.x}, y: ${q.y}, z: ${q.z}, w: ${q.w}}
  m_LocalPosition: {x: ${pos[0]}, y: ${pos[1]}, z: ${pos[2]}}
  m_LocalScale: {x: ${scale[0]}, y: ${scale[1]}, z: ${scale[2]}}
  m_ConstrainProportionsScale: 0
  m_Children: []
  m_Father: {fileID: ${parent}}
  m_LocalEulerAnglesHint: {x: ${euler[0]}, y: ${euler[1]}, z: ${euler[2]}}
--- !u!33 &${mf}
MeshFilter:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Mesh: {fileID: ${mesh}, guid: ${BUILTIN}, type: 0}
--- !u!23 &${mr}
MeshRenderer:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Enabled: 1
  m_CastShadows: 1
  m_ReceiveShadows: 1
  m_DynamicOccludee: 1
  m_StaticShadowCaster: 0
  m_MotionVectors: 1
  m_LightProbeUsage: 1
  m_ReflectionProbeUsage: 1
  m_RayTracingMode: 2
  m_RenderingLayerMask: 1
  m_RendererPriority: 0
  m_Materials:
  - {fileID: 2100000, guid: ${matGuid}, type: 2}
  m_StaticBatchInfo:
    firstSubMesh: 0
    subMeshCount: 0
  m_StaticBatchRoot: {fileID: 0}
  m_ProbeAnchor: {fileID: 0}
  m_LightProbeVolumeOverride: {fileID: 0}
  m_ScaleInLightmap: 1
  m_ReceiveGI: 1
  m_PreserveUVs: 1
  m_IgnoreNormalsForChartDetection: 0
  m_ImportantGI: 0
  m_StitchLightmapSeams: 1
  m_SelectedEditorRenderState: 3
  m_MinimumChartSize: 4
  m_AutoUVMaxDistance: 0.5
  m_AutoUVMaxAngle: 89
  m_LightmapParameters: {fileID: 0}
  m_SortingLayerID: 0
  m_SortingLayer: 0
  m_SortingOrder: 0
--- !u!${colliderType} &${col}
${colliderType === 135 ? "SphereCollider" : colliderType === 136 ? "CapsuleCollider" : "BoxCollider"}:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Material: {fileID: 0}
  m_IncludeLayers:
    serializedVersion: 2
    m_Bits: 0
  m_ExcludeLayers:
    serializedVersion: 2
    m_Bits: 0
  m_LayerOverridePriority: 0
  m_IsTrigger: 0
  m_ProvidesContacts: 0
  m_Enabled: 1
  ${colliderType === 135 ? "m_Radius: 0.5\n  m_Center: {x: 0, y: 0, z: 0}" : colliderType === 136 ? "m_Height: 2\n  m_Radius: 0.5\n  m_Direction: 1\n  m_Center: {x: 0, y: 0, z: 0}" : "m_Size: {x: 1, y: 1, z: 1}\n  m_Center: {x: 0, y: 0, z: 0}"}
`);
  scripts.forEach((script, i) => {
    push(`--- !u!114 &${scriptIds[i]}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${script.guid}, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
${script.fields || ""}`);
  });
  return { go, tr, scripts: scriptIds };
}

function addLight(name, type, color, intensity, pos, euler, range = 10, parent = 0) {
  const go = id();
  const tr = id();
  const light = id();
  const extra = id();
  const q = eulerToQuat(euler[0], euler[1], euler[2]);
  if (!parent) roots.push(tr);
  named[name] = { go, tr, light };
  push(`--- !u!1 &${go}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
  - component: {fileID: ${tr}}
  - component: {fileID: ${light}}
  - component: {fileID: ${extra}}
  m_Layer: 0
  m_Name: ${name}
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &${tr}
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  serializedVersion: 2
  m_LocalRotation: {x: ${q.x}, y: ${q.y}, z: ${q.z}, w: ${q.w}}
  m_LocalPosition: {x: ${pos[0]}, y: ${pos[1]}, z: ${pos[2]}}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_ConstrainProportionsScale: 0
  m_Children: []
  m_Father: {fileID: ${parent}}
  m_LocalEulerAnglesHint: {x: ${euler[0]}, y: ${euler[1]}, z: ${euler[2]}}
--- !u!108 &${light}
Light:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Enabled: 1
  serializedVersion: 11
  m_Type: ${type}
  m_Color: {r: ${color[0]}, g: ${color[1]}, b: ${color[2]}, a: 1}
  m_Intensity: ${intensity}
  m_Range: ${range}
  m_SpotAngle: 30
  m_InnerSpotAngle: 21.80208
  m_CookieSize: 10
  m_Shadows:
    m_Type: 2
    m_Resolution: -1
    m_CustomResolution: -1
    m_Strength: 1
    m_Bias: 0.05
    m_NormalBias: 0.4
    m_NearPlane: 0.2
    m_CullingMatrixOverride:
      e00: 1
      e01: 0
      e02: 0
      e03: 0
      e10: 0
      e11: 1
      e12: 0
      e13: 0
      e20: 0
      e21: 0
      e22: 1
      e23: 0
      e30: 0
      e31: 0
      e32: 0
      e33: 1
    m_UseCullingMatrixOverride: 0
  m_Cookie: {fileID: 0}
  m_DrawHalo: 0
  m_Flare: {fileID: 0}
  m_RenderMode: 0
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingLayerMask: 1
  m_Lightmapping: 4
  m_LightShadowCasterMode: 0
  m_AreaSize: {x: 1, y: 1}
  m_BounceIntensity: 1
  m_ColorTemperature: 6570
  m_UseColorTemperature: 0
  m_BoundingSphereOverride: {x: 0, y: 0, z: 0, w: 0}
  m_UseBoundingSphereOverride: 0
  m_UseViewFrustumForShadowCasterCull: 1
  m_ForceVisible: 0
  m_ShadowRadius: 0
  m_ShadowAngle: 0
  m_LightUnit: 1
  m_LuxAtDistance: 1
  m_EnableSpotReflector: 1
--- !u!114 &${extra}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${go}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${GUIDS.URPLight}, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
  m_Version: 3
  m_UsePipelineSettings: 1
  m_AdditionalLightsShadowResolutionTier: 2
  m_LightLayerMask: 1
  m_RenderingLayers: 1
  m_CustomShadowLayers: 0
  m_ShadowLayerMask: 1
  m_ShadowRenderingLayers: 1
  m_LightCookieSize: {x: 1, y: 1}
  m_LightCookieOffset: {x: 0, y: 0}
  m_SoftShadowQuality: 0
`);
  return { go, tr, light };
}

function tree(pos, scale, idx) {
  primitive(`TreeTrunk_${idx}`, "Cylinder", [pos[0], pos[1] + 1.6 * scale, pos[2]], [0.45 * scale, 1.6 * scale, 0.45 * scale], "trunk");
  primitive(`TreeCanopy_${idx}`, "Sphere", [pos[0], pos[1] + 4.2 * scale, pos[2]], [3.6 * scale, 3.6 * scale, 3.6 * scale], "canopy");
}

function house(name, pos, yaw, mat) {
  const root = empty(name, pos, [0, yaw, 0]);
  primitive(`${name}_Body`, "Cube", [0, 3.4, 0], [8.2, 6.8, 6.4], mat, [0, 0, 0], root.tr);
  primitive(`${name}_Roof`, "Cube", [0, 7.4, 0], [9.2, 1.4, 7.2], "roof", [0, 0, 8], root.tr);
}

function npc(name, role, pos, mat, height) {
  primitive(name, "Capsule", [pos[0], pos[1] + 0.9 * height, pos[2]], [0.62, 0.9 * height, 0.62], mat, [0, 0, 0], 0, [
    { guid: GUIDS.NpcActor, fields: `  displayName: ${name}\n  role: ${role}\n` },
  ]);
}

fs.mkdirSync(matDir, { recursive: true });
for (const [name, rgb] of Object.entries(colors)) {
  const guid = guidFrom(name);
  fs.writeFileSync(path.join(matDir, `${name}.mat`), matYaml(name, rgb));
  fs.writeFileSync(
    path.join(matDir, `${name}.mat.meta`),
    `fileFormatVersion: 2
guid: ${guid}
NativeFormatImporter:
  externalObjects: {}
  mainObjectFileID: 2100000
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`,
  );
}

addLight("KeyLight", 1, [1, 0.93, 0.78], 1.35, [0, 12, 0], [48, -28, 0]);
addLight("FillLight", 1, [0.55, 0.7, 0.85], 0.28, [0, 8, 0], [20, 140, 0]);

primitive("PlazaStone", "Cube", [0, -0.08, 0], [42, 0.16, 36], "plaza");
for (let i = 0; i < 18; i++) {
  const x = Math.sin(i * 2.1) * 16;
  const z = Math.cos(i * 1.7) * 12;
  primitive(`PlazaWear_${i}`, "Cube", [x, 0.03, z], [1.4 * (0.6 + (i % 3) * 0.2), 0.05, 1.4 * 0.7], "wear", [0, i * 21, 0]);
}
for (let i = 0; i < 7; i++) {
  const sway = Math.sin(i * 0.7) * 1.1;
  primitive(`Road_${i}`, "Cube", [sway, 0.01, -10 - i * 2.3], [4.4 + (i % 3) * 0.35, 0.08, 2.6], i % 2 === 0 ? "roadA" : "roadB", [0, sway * 8, 0]);
}

const core = empty("GenesisCore", [0, 0, 2]);
primitive("CoreTrunk", "Cylinder", [0, 3.4, 0], [1.6, 3.4, 1.6], "core", [0, 0, 0], core.tr);
primitive("CoreShard", "Cube", [0.2, 7.2, 0], [1.1, 2.8, 1.1], "shard", [18, 25, 12], core.tr);
addLight("CoreGlow", 2, [0.45, 0.95, 0.9], 2.4, [0, 6.2, 0], [0, 0, 0], 16, core.tr);

house("House East", [11, 0, 6], 28, "houseE");
house("House West", [-12, 0, 4], -18, "houseW");
primitive("Market Stall", "Cube", [8.5, 0.55, -4], [2.6, 1.1, 1.6], "stall");
primitive("StallCloth", "Cube", [8.5, 1.35, -4], [2.8, 0.12, 1.8], "cloth");
primitive("Lyra Sanctuary", "Cylinder", [16, 1.1, 1], [2.2, 1.1, 2.2], "shrine");
for (let i = 0; i < 3; i++) {
  const px = -18 + i * 2.2;
  const py = 2.4;
  const pz = 8;
  primitive(`Arena Approach_${i}`, "Cylinder", [px, py, pz], [0.18, 2.4, 0.18], "pole");
  primitive(`Banner_${i}`, "Cube", [px + 0.45, py + 0.6, pz], [0.9, 1.6, 0.08], "banner");
}
tree([-7, 0, 10], 1.1, 1);
tree([6.4, 0, 11], 0.95, 2);
tree([-3, 0, -6], 0.8, 3);
primitive("GatePillar_L", "Cube", [-4.2, 3.4, -18.5], [1.4, 6.8, 1.6], "pillar");
primitive("GatePillar_R", "Cube", [4.2, 3.4, -18.5], [1.4, 6.8, 1.6], "pillar");
primitive("SouthGate", "Cube", [0, 6.4, -18.5], [10.2, 1.2, 1.4], "stone");
for (let i = 0; i < 9; i++) {
  tree([-16 + i * 4.1, 0, -28 - (i % 3) * 2.4], 1.35 + (i % 3) * 0.2, 10 + i);
}
primitive("VerdantisRidge", "Cube", [0, 8, -42], [48, 16, 6], "ridge");

npc("Theo", "merchant", [7.2, 0, -3.2], "theo", 0.95);
npc("Kael", "researcher", [-4.2, 0, 3.4], "kael", 1);
npc("Lyra", "breeder", [14.6, 0, 1.2], "lyra", 0.92);
npc("Guard", "guard", [-2.4, 0, -16.2], "guard", 1.08);
npc("Guard B", "guard", [2.6, 0, -16.2], "guardB", 1.06);
npc("Adventurer", "adventurer", [-8, 0, -2], "adventurer", 0.98);

const player = primitive("Player", "Capsule", [0, 0.9, -7], [0.7, 0.9, 0.7], "player", [0, 0, 0], 0, [
  { guid: GUIDS.PlayerMotor, fields: "  speed: 6.2\n  animator: {fileID: 0}\n" },
  { guid: GUIDS.PlayerBeacon, fields: "" },
]);
const playerMotor = player.scripts[0];

const baby = primitive("Companion", "Sphere", [-0.9, 0.45, -8.4], [0.7, 0.7, 0.7], "pyron", [0, 0, 0], 0, [
  {
    guid: GUIDS.CompanionFollower,
    fields: `  owner: {fileID: ${player.tr}}\n  temperament: FRIENDLY\n  followDistance: 1.7\n  runDistance: 4.4\n`,
  },
]);
const follow = baby.scripts[0];

const camOff = rotateOffset(40, 32, 14.5);
const camPos = [camOff.x, 0.9 + camOff.y, -7 + camOff.z];
const camQ = eulerToQuat(40, 32, 0);
const camGo = id();
const camTr = id();
const camComp = id();
const camAudio = id();
const camUrp = id();
const camRig = id();
roots.push(camTr);
push(`--- !u!1 &${camGo}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  serializedVersion: 6
  m_Component:
  - component: {fileID: ${camTr}}
  - component: {fileID: ${camComp}}
  - component: {fileID: ${camAudio}}
  - component: {fileID: ${camUrp}}
  - component: {fileID: ${camRig}}
  m_Layer: 0
  m_Name: WorldCamera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &${camTr}
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${camGo}}
  serializedVersion: 2
  m_LocalRotation: {x: ${camQ.x}, y: ${camQ.y}, z: ${camQ.z}, w: ${camQ.w}}
  m_LocalPosition: {x: ${camPos[0]}, y: ${camPos[1]}, z: ${camPos[2]}}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_ConstrainProportionsScale: 0
  m_Children: []
  m_Father: {fileID: 0}
  m_LocalEulerAnglesHint: {x: 40, y: 32, z: 0}
--- !u!20 &${camComp}
Camera:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${camGo}}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 1
  m_BackGroundColor: {r: 0.19215687, g: 0.3019608, b: 0.4745098, a: 0}
  m_projectionMatrixMode: 1
  m_GateFitMode: 2
  m_FOVAxisMode: 0
  m_Iso: 200
  m_ShutterSpeed: 0.005
  m_Aperture: 16
  m_FocusDistance: 10
  m_FocalLength: 50
  m_BladeCount: 5
  m_Curvature: {x: 2, y: 11}
  m_BarrelClipping: 0.25
  m_Anamorphism: 0
  m_SensorSize: {x: 36, y: 24}
  m_LensShift: {x: 0, y: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.15
  far clip plane: 180
  field of view: 40
  orthographic: 0
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 1
  m_AllowMSAA: 1
  m_AllowDynamicResolution: 0
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
--- !u!81 &${camAudio}
AudioListener:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${camGo}}
  m_Enabled: 1
--- !u!114 &${camUrp}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${camGo}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${GUIDS.URPCamera}, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
  m_RenderShadows: 1
  m_RequiresDepthTextureOption: 2
  m_RequiresOpaqueTextureOption: 2
  m_CameraType: 0
  m_Cameras: []
  m_RendererIndex: -1
  m_VolumeLayerMask:
    serializedVersion: 2
    m_Bits: 1
  m_VolumeTrigger: {fileID: 0}
  m_VolumeFrameworkUpdateModeOption: 2
  m_RenderPostProcessing: 0
  m_Antialiasing: 0
  m_AntialiasingQuality: 2
  m_StopNaN: 0
  m_Dithering: 0
  m_ClearDepth: 1
  m_AllowXRRendering: 1
  m_AllowHDROutput: 1
  m_UseScreenCoordOverride: 0
  m_ScreenSizeOverride: {x: 0, y: 0, z: 0, w: 0}
  m_ScreenCoordScaleBias: {x: 0, y: 0, z: 0, w: 0}
  m_RequiresDepthTexture: 0
  m_RequiresColorTexture: 0
  m_Version: 2
`);
push(`--- !u!114 &${camRig}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: ${camGo}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${GUIDS.WorldCameraRig}, type: 3}
  m_Name: 
  m_EditorClassIdentifier: 
  target: {fileID: ${player.tr}}
  pitch: 40
  yaw: 32
  distance: 14.5
  minDistance: 10
  maxDistance: 18
  follow: 7
  lookHeight: 1.35
`);

empty("WorldBridge", [0, 0, 0], [0, 0, 0], 0, [
  {
    guid: GUIDS.WorldBridge,
    fields: `  player: {fileID: ${playerMotor}}\n  companion: {fileID: ${follow}}\n  cameraRig: {fileID: ${camRig}}\n`,
  },
]);
empty("WorldHud", [0, 0, 0], [0, 0, 0], 0, [
  {
    guid: GUIDS.WorldHud,
    fields: `  characterName: Tamer
  level: 1
  hp01: 0.86
  companionName: Pyron
  companionStage: Baby
  companionLevel: 7
  growth01: 0.42
  region: Haven · Genesis Plaza
`,
  },
]);

const header = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 10
  m_Fog: 1
  m_FogColor: {r: 0.62, g: 0.72, b: 0.78, a: 1}
  m_FogMode: 2
  m_FogDensity: 0.018
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.42, g: 0.46, b: 0.5, a: 1}
  m_AmbientEquatorColor: {r: 0.42, g: 0.46, b: 0.5, a: 1}
  m_AmbientGroundColor: {r: 0.42, g: 0.46, b: 0.5, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 3
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_UseRadianceAmbientProbe: 0
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 13
  m_GIWorkflowMode: 1
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 0
  m_LightmapEditorSettings:
    serializedVersion: 12
    m_Resolution: 2
    m_BakeResolution: 40
    m_AtlasSize: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_ExtractAmbientOcclusion: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_ReflectionCompression: 2
    m_MixedBakeMode: 2
    m_BakeBackend: 1
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 512
    m_PVRBounces: 2
    m_PVREnvironmentSampleCount: 256
    m_PVREnvironmentReferencePointCount: 2048
    m_PVRFilteringMode: 1
    m_PVRDenoiserTypeDirect: 1
    m_PVRDenoiserTypeIndirect: 1
    m_PVRDenoiserTypeAO: 1
    m_PVRFilterTypeDirect: 0
    m_PVRFilterTypeIndirect: 0
    m_PVRFilterTypeAO: 0
    m_PVREnvironmentMIS: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousPositionSigmaDirect: 0.5
    m_PVRFilteringAtrousPositionSigmaIndirect: 2
    m_PVRFilteringAtrousPositionSigmaAO: 1
    m_ExportTrainingData: 0
    m_TrainingDataDestination: TrainingData
    m_LightProbeSampleCountMultiplier: 4
  m_LightingDataAsset: {fileID: 0}
  m_LightingSettings: {fileID: 0}
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 3
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    buildHeightMesh: 0
    maxJobWorkers: 0
    preserveTilesOutsideBounds: 0
    debug:
      m_Flags: 0
  m_NavMeshData: {fileID: 0}
`;

const footer = `--- !u!1660057539 &9223372036854775807
SceneRoots:
  m_ObjectHideFlags: 0
  m_Roots:
${roots.map((r) => `  - {fileID: ${r}}`).join("\n")}
`;

fs.writeFileSync(scenePath, header + blocks.join("") + footer);
fs.writeFileSync(
  scenePath + ".meta",
  `fileFormatVersion: 2
guid: b7c91e2a4d5f6084ab12c3d4e5f60718
DefaultImporter:
  externalObjects: {}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`,
);

console.log(`wrote ${scenePath} (${fs.statSync(scenePath).size} bytes, ${roots.length} roots)`);
