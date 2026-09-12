using System.Collections;
using System.IO;
using UnityEngine;

namespace Genoryx
{
    public partial class CharacterAssembler : MonoBehaviour
    {
        public CharacterAppearanceData appearance = new CharacterAppearanceData();
        public Transform visualRoot;
        public Transform creatureFollowAnchor;
        public Transform previewPivot;
        public Transform bodySlot;
        public bool ready;
        public string lastError;
        public Animator animator;
        public CharacterQualityMode quality = CharacterQualityMode.PLAYER_LOCAL;
        public bool debugBodyRegions;
        public bool debugModularParts;
        public Mesh faceBaseMesh;
        public GameObject eyeLeft;
        public GameObject eyeRight;

        Transform faceSlot;
        Transform hairSlot;
        Transform chestSlot;
        Transform legsSlot;
        Transform glovesSlot;
        Transform bootsSlot;
        Transform capeSlot;
        Transform backSlot;
        int applyVersion;

        public static GameObject SpawnRoot(string name, Vector3 pos)
        {
            var root = new GameObject(name);
            root.transform.position = pos;
            var col = root.AddComponent<CapsuleCollider>();
            col.center = new Vector3(0f, 0.9f, 0f);
            col.height = WorldScale.HumanHeight;
            col.radius = 0.28f;

            var gameplay = new GameObject("Gameplay");
            gameplay.transform.SetParent(root.transform, false);
            var follow = new GameObject("CreatureFollowAnchor");
            follow.transform.SetParent(root.transform, false);
            var pivot = new GameObject("CharacterPreviewPivot");
            pivot.transform.SetParent(root.transform, false);
            var visual = new GameObject("CharacterVisualRoot");
            visual.transform.SetParent(pivot.transform, false);

            var assembler = root.AddComponent<CharacterAssembler>();
            assembler.visualRoot = visual.transform;
            assembler.previewPivot = pivot.transform;
            assembler.creatureFollowAnchor = follow.transform;
            assembler.CreateSlots();
            assembler.appearance = CharacterAppearanceData.Phase1();
            return root;
        }

        public static GameObject SpawnPlayer(string name, Vector3 pos, CharacterAppearanceData data, CharacterQualityMode quality = CharacterQualityMode.PLAYER_LOCAL)
        {
            var root = SpawnRoot(name, pos);
            var assembler = root.GetComponent<CharacterAssembler>();
            assembler.quality = quality;
            assembler.ApplyAppearance(data ?? CharacterAppearanceData.Phase1());
            return root;
        }

        void Start()
        {
            if (!ready && visualRoot != null)
            {
                ApplyAppearance(appearance ?? CharacterAppearanceData.Phase1());
            }
        }

        void CreateSlots()
        {
            bodySlot = Slot("CanonicalBody");
            faceSlot = Slot("Face");
            hairSlot = Slot("HairSlot");
            chestSlot = Slot("ChestSlot");
            legsSlot = Slot("LegsSlot");
            glovesSlot = Slot("GlovesSlot");
            bootsSlot = Slot("BootsSlot");
            capeSlot = Slot("Cape");
            backSlot = Slot("Back");
        }

        Transform Slot(string name)
        {
            var go = new GameObject(name);
            go.transform.SetParent(visualRoot, false);
            return go.transform;
        }

        public void ApplyAppearance(CharacterAppearanceData data)
        {
            appearance = data ?? CharacterAppearanceData.Phase1();
            StopAllCoroutines();
            StartCoroutine(ApplyRoutine());
        }

        public void SetBody(string id) { appearance.bodyType = id; ApplyAppearance(appearance); }
        public void SetFace(string id) { appearance.faceId = id; CharacterFaceEyes.ApplyFace(this); }
        public void SetHair(string id) { appearance.hairId = id; StartCoroutine(RefreshSlot(hairSlot, id, "HairMesh")); }
        public void SetChest(string id) { appearance.chestId = id; StartCoroutine(RefreshSlot(chestSlot, id, "ChestMesh")); }
        public void SetLegs(string id) { appearance.legsId = id; StartCoroutine(RefreshSlot(legsSlot, id, "LegsMesh")); }
        public void SetGloves(string id) { appearance.glovesId = id; StartCoroutine(RefreshSlot(glovesSlot, id, "GlovesMesh")); }
        public void SetBoots(string id) { appearance.bootsId = id; StartCoroutine(RefreshSlot(bootsSlot, id, "BootsMesh")); }

        public void SetSkinTone(string id)
        {
            appearance.skinTone = id;
            ApplySkinTint();
        }

        public void SetHairColor(string id)
        {
            appearance.hairColor = id;
            TintNamed("HairMesh", appearance.HairTint());
        }

        public void SetEyeColor(string id)
        {
            appearance.eyeColor = id;
            CharacterFaceEyes.ApplyEyes(this);
        }

        public void Randomize()
        {
            ApplyAppearance(CharacterAppearanceData.RandomValid());
        }

        IEnumerator ApplyRoutine()
        {
            ready = false;
            lastError = null;
            applyVersion += 1;
            var token = applyVersion;
            CharacterPartCatalog.Ensure();
            if (!CharacterAssets.PlayerCharacterReady())
            {
                lastError = "Pipeline UnityReady/GLB ausente. Não uso PNG nem cápsula.";
                Debug.LogError("[GENORYX] " + lastError);
                yield break;
            }

            yield return EquipBody(token);
            if (token != applyVersion)
            {
                yield break;
            }

            yield return RefreshSlot(hairSlot, appearance.hairId, "HairMesh");
            yield return RefreshSlot(chestSlot, appearance.chestId, "ChestMesh");
            yield return RefreshSlot(legsSlot, appearance.legsId, "LegsMesh");
            yield return RefreshSlot(bootsSlot, appearance.bootsId, "BootsMesh");
            CharacterFaceEyes.ApplyFace(this);
            CharacterFaceEyes.ApplyEyes(this);
            ApplySkinTint();
            SetHairColor(appearance.hairColor);
            ApplyBodyMasks();
            ApplyModularDebug();
            FitAssembledHeight();
            CharacterQuality.Apply(this);
            BindLocomotion();
            CharacterPerformanceValidator.Measure(gameObject);
            ready = true;
        }

        IEnumerator EquipBody(int token)
        {
            Clear(bodySlot);
            GameObject model = null;
            var lib = CharacterPartLibrary.Load();
            if (lib != null && lib.bodyPrefab != null)
            {
                model = Object.Instantiate(lib.bodyPrefab, bodySlot, false);
                model.name = "CanonicalBody";
            }
            else
            {
                var path = File.Exists(CharacterPartCatalog.CanonicalBody())
                    ? CharacterPartCatalog.CanonicalBody()
                    : CharacterGltfLoader.Phase1File("tamer.rigged.glb");
                var load = CharacterGltfLoader.Instantiate(path, bodySlot, "BodyMesh");
                while (!load.IsCompleted)
                {
                    yield return null;
                }

                if (token != applyVersion)
                {
                    yield break;
                }

                if (load.IsFaulted)
                {
                    lastError = load.Exception?.GetBaseException().Message ?? "Falha no GLB do corpo.";
                    Debug.LogError("[GENORYX] " + lastError);
                    yield break;
                }

                model = load.Result;
                model.name = "CanonicalBody";
            }

            if (token != applyVersion)
            {
                yield break;
            }

            faceBaseMesh = null;
            eyeLeft = null;
            eyeRight = null;
            HideNonCanonicalJunk(model);
            StripColliders(model);
            EnableShadows(model);
            ExpandSkinBounds(model);
            BindBodySkin();
            animator = model.GetComponentInChildren<Animator>();
            if (animator == null)
            {
                animator = model.AddComponent<Animator>();
            }

            animator.applyRootMotion = false;
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            animator.name = "GenoryxCanonicalAnimator";
            if (lib != null)
            {
                if (lib.canonicalAvatar != null)
                {
                    animator.avatar = lib.canonicalAvatar;
                }

                if (lib.animator != null)
                {
                    animator.runtimeAnimatorController = lib.animator;
                }
            }

            if (animator.avatar == null)
            {
                var hips = BoneMapper.FindCanonical(bodySlot, "Hips") ?? BoneMapper.FindCanonical(model.transform, "Hips");
                if (hips != null)
                {
                    animator.avatar = AvatarBuilder.BuildGenericAvatar(model, hips.name);
                }
            }

            yield break;
        }

        IEnumerator RefreshSlot(Transform slot, string id, string meshName)
        {
            DestroyNamed(meshName);
            Clear(slot);
            var lib = CharacterPartLibrary.Load();
            var prefab = lib != null ? lib.Prefab(id) : null;
            GameObject model = null;
            if (prefab != null)
            {
                model = Object.Instantiate(prefab, slot, false);
                model.name = meshName;
            }
            else
            {
                var part = CharacterPartCatalog.Find(id);
                if (part == null || string.IsNullOrEmpty(part.file))
                {
                    yield break;
                }

                var path = CharacterPartCatalog.GeneratedFile(part.file);
                if (!File.Exists(path))
                {
                    Debug.LogWarning("[GENORYX] Peça 3D ausente: " + path);
                    yield break;
                }

                var load = CharacterGltfLoader.Instantiate(path, slot, meshName);
                while (!load.IsCompleted)
                {
                    yield return null;
                }

                if (load.IsFaulted)
                {
                    Debug.LogError("[GENORYX] Peça falhou: " + id + " " + load.Exception?.GetBaseException().Message);
                    yield break;
                }

                model = load.Result;
                model.name = meshName;
            }

            RenameRenderers(model, meshName);
            HideNonCanonicalJunk(model);
            EnableShadows(model);
            StripColliders(model);
            ExpandSkinBounds(model);
            var skinned = model.GetComponentInChildren<SkinnedMeshRenderer>(true) != null;
            var partDef = CharacterPartCatalog.Find(id);
            if (skinned)
            {
                BindPartToCanonicalAnimator(model);
            }
            else if (partDef != null)
            {
                AttachToBone(model.transform, partDef.bone, meshName);
            }

            CharacterPartFitProfile.Apply(model.transform, id);
            if (meshName != "HairMesh")
            {
                FitPartInPlace(model.transform, meshName);
            }

            if (slot == hairSlot)
            {
                BindHairMaterial();
                TintNamed("HairMesh", appearance.HairTint());
            }

            var renderer = slot.GetComponentInChildren<Renderer>(true);
            var check = ModularRendererValidator.Validate(renderer, transform, meshName);
            Debug.Log("[GENORYX] " + check);
            if (check.StartsWith("OK"))
            {
                ApplyBodyMasks();
            }

            ApplyModularDebug();
            CharacterQuality.Apply(this);
        }

        void BindLocomotion()
        {
            if (animator == null)
            {
                return;
            }

            var driver = gameObject.GetComponent<CharacterLocomotionDriver>();
            if (driver == null)
            {
                driver = gameObject.AddComponent<CharacterLocomotionDriver>();
            }

            driver.Bind(animator);
        }

        void ExpandSkinBounds(GameObject model)
        {
            if (model == null)
            {
                return;
            }

            foreach (var skin in model.GetComponentsInChildren<SkinnedMeshRenderer>(true))
            {
                skin.updateWhenOffscreen = quality == CharacterQualityMode.PLAYER_LOCAL;
                var bounds = skin.localBounds;
                if (bounds.size.sqrMagnitude < 0.05f || bounds.size.y < 0.2f)
                {
                    skin.localBounds = new Bounds(Vector3.up * 0.9f, new Vector3(1.6f, 2.2f, 1.6f));
                }
                else
                {
                    bounds.Expand(0.35f);
                    skin.localBounds = bounds;
                }
            }
        }

        void ApplyModularDebug()
        {
            var lib = CharacterPartLibrary.Load();
            if (!debugModularParts || lib == null)
            {
                return;
            }

            PaintSlot(bodySlot, lib.debugBody);
            PaintSlot(hairSlot, lib.debugHair);
            PaintSlot(chestSlot, lib.debugChest);
            PaintSlot(legsSlot, lib.debugPants);
            PaintSlot(bootsSlot, lib.debugBoots);
        }

        static void PaintSlot(Transform slot, Material mat)
        {
            if (slot == null || mat == null)
            {
                return;
            }

            foreach (var renderer in slot.GetComponentsInChildren<Renderer>(true))
            {
                renderer.sharedMaterial = mat;
            }
        }

        void BindPartToCanonicalAnimator(GameObject part)
        {
            if (part == null)
            {
                return;
            }

            var extras = part.GetComponentsInChildren<Animator>(true);
            for (var i = 0; i < extras.Length; i++)
            {
                if (extras[i] != animator)
                {
                    extras[i].enabled = false;
                    extras[i].runtimeAnimatorController = null;
                    if (Application.isPlaying)
                    {
                        Destroy(extras[i]);
                    }
                    else
                    {
                        DestroyImmediate(extras[i]);
                    }
                }
            }

            foreach (var skin in part.GetComponentsInChildren<SkinnedMeshRenderer>(true))
            {
                skin.updateWhenOffscreen = true;
                skin.enabled = true;
                var bounds = skin.localBounds;
                if (bounds.size.y < 0.2f)
                {
                    skin.localBounds = new Bounds(Vector3.up * 0.9f, new Vector3(1.8f, 2.4f, 1.8f));
                }
            }
        }

        void ApplyBodyMasks()
        {
            if (bodySlot == null)
            {
                return;
            }

            var hide = new System.Collections.Generic.HashSet<string>();
            if (PartCoversBody(hairSlot, "HairMesh"))
            {
                hide.Add("SCALP");
            }

            foreach (var t in bodySlot.GetComponentsInChildren<Transform>(true))
            {
                if (!t.name.StartsWith("Body_"))
                {
                    continue;
                }

                var region = t.name.Substring(5);
                var hidden = hide.Contains(region);
                t.gameObject.SetActive(!hidden);
                if (debugBodyRegions)
                {
                    var renderer = t.GetComponent<Renderer>();
                    if (renderer != null)
                    {
                        var block = new MaterialPropertyBlock();
                        renderer.GetPropertyBlock(block);
                        block.SetColor("_BaseColor", RegionDebugColor(region));
                        renderer.SetPropertyBlock(block);
                    }
                }
            }
        }

        bool PartCoversBody(Transform slot, string label)
        {
            var renderer = slot != null ? slot.GetComponentInChildren<Renderer>(true) : null;
            renderer ??= FindNamedRenderer(label);
            if (renderer == null || !renderer.gameObject.activeInHierarchy || !renderer.enabled)
            {
                return false;
            }

            var body = RendererBounds(bodySlot);
            var part = renderer.bounds;
            if (part.size.sqrMagnitude < 0.002f)
            {
                return false;
            }

            return Vector3.Distance(part.center, body.center) < 1.6f;
        }

        static void CollectHide(System.Collections.Generic.HashSet<string> hide, string partId)
        {
            var part = CharacterPartCatalog.Find(partId);
            if (part == null || string.IsNullOrEmpty(part.hiddenBodyRegions))
            {
                return;
            }

            foreach (var token in part.hiddenBodyRegions.Split(','))
            {
                var region = token.Trim();
                if (region.Length > 0)
                {
                    hide.Add(region);
                }
            }
        }

        void FitPartInPlace(Transform part, string meshName)
        {
            var bodyBounds = RendererBounds(bodySlot);
            var bodyHeight = Mathf.Max(bodyBounds.size.y, 1.6f);
            var targetHeight = meshName switch
            {
                "HairMesh" => bodyHeight * 0.22f,
                "ChestMesh" => bodyHeight * 0.38f,
                "LegsMesh" => bodyHeight * 0.48f,
                "BootsMesh" => bodyHeight * 0.20f,
                _ => bodyHeight * 0.3f
            };

            var bounds = RendererBounds(part);
            if (bounds.size.y > 0.05f)
            {
                var factor = targetHeight / bounds.size.y;
                if (factor > 0.15f && factor < 8f)
                {
                    part.localScale *= factor;
                }
            }

            bounds = RendererBounds(part);
            var dest = bodyBounds.center;
            dest.y = meshName switch
            {
                "HairMesh" => bodyBounds.max.y - bounds.size.y * 0.35f,
                "ChestMesh" => bodyBounds.min.y + bodyBounds.size.y * 0.62f,
                "LegsMesh" => bodyBounds.min.y + bodyBounds.size.y * 0.32f,
                "BootsMesh" => bodyBounds.min.y + bodyBounds.size.y * 0.08f,
                _ => dest.y
            };
            part.position += dest - bounds.center;
        }

        static void HideNonCanonicalJunk(GameObject model)
        {
            foreach (var renderer in model.GetComponentsInChildren<MeshRenderer>(true))
            {
                if (renderer.GetComponent<SkinnedMeshRenderer>() != null)
                {
                    continue;
                }

                var key = renderer.gameObject.name.ToLowerInvariant();
                if (key.Contains("ico") || key.Contains("sphere") || renderer.sharedMaterial == null)
                {
                    renderer.gameObject.SetActive(false);
                }
            }
        }

        void AttachToBone(Transform part, string bone, string meshName)
        {
            if (string.IsNullOrEmpty(bone) || bodySlot == null)
            {
                return;
            }

            var target = BoneMapper.FindCanonical(bodySlot, bone);
            if (target == null)
            {
                return;
            }

            part.SetParent(target, true);
        }

        void TintNamed(string meshName, Color color)
        {
            var renderer = FindNamedRenderer(meshName);
            if (renderer != null)
            {
                if (meshName == "HairMesh")
                {
                    var albedo = renderer.sharedMaterial != null ? renderer.sharedMaterial.mainTexture : null;
                    renderer.sharedMaterial = CharacterSharedMaterials.HairShared(albedo);
                }

                var block = new MaterialPropertyBlock();
                renderer.GetPropertyBlock(block);
                block.SetColor("_BaseColor", color);
                block.SetColor("_Color", color);
                renderer.SetPropertyBlock(block);
                return;
            }

            if (meshName == "HairMesh")
            {
                TintSlot(hairSlot, color);
            }
        }

        void BindHairMaterial()
        {
            var renderer = FindNamedRenderer("HairMesh") ?? (hairSlot != null ? hairSlot.GetComponentInChildren<Renderer>(true) : null);
            if (renderer == null)
            {
                return;
            }

            var albedo = renderer.sharedMaterial != null ? renderer.sharedMaterial.mainTexture : null;
            renderer.sharedMaterial = CharacterSharedMaterials.HairShared(albedo);
        }

        void BindBodySkin()
        {
            if (bodySlot == null)
            {
                return;
            }

            foreach (var renderer in bodySlot.GetComponentsInChildren<Renderer>(true))
            {
                var name = renderer.gameObject.name.ToUpperInvariant();
                var matName = renderer.sharedMaterial != null ? renderer.sharedMaterial.name : "";
                if (name.Contains("PELVIS") || matName.IndexOf("Underwear", System.StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    renderer.sharedMaterial = CharacterSharedMaterials.Underwear();
                    continue;
                }

                var albedo = renderer.sharedMaterial != null ? renderer.sharedMaterial.mainTexture : null;
                renderer.sharedMaterial = CharacterSharedMaterials.BodySkin(albedo);
            }
        }

        void ApplySkinTint()
        {
            if (bodySlot == null)
            {
                return;
            }

            var tint = appearance.SkinTint();
            var block = new MaterialPropertyBlock();
            foreach (var renderer in bodySlot.GetComponentsInChildren<Renderer>(true))
            {
                var name = renderer.gameObject.name.ToUpperInvariant();
                var matName = renderer.sharedMaterial != null ? renderer.sharedMaterial.name : "";
                if (name.Contains("PELVIS") || matName.IndexOf("Underwear", System.StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    continue;
                }

                renderer.GetPropertyBlock(block);
                block.SetColor("_TargetSkinColor", tint);
                block.SetColor("_SkinTint", tint);
                block.SetFloat("_PreserveLighting", 1f);
                renderer.SetPropertyBlock(block);
            }
        }

        static bool IsSkinRegion(string name)
        {
            return name.Contains("HEAD") || name.Contains("TORSO") || name.Contains("ARM")
                   || name.Contains("HAND") || name.Contains("LEG") || name.Contains("FOOT") || name.Contains("SCALP");
        }

        static Color RegionDebugColor(string region)
        {
            return region switch
            {
                "HEAD" => new Color(1f, 0.7f, 0.7f),
                "SCALP" => new Color(1f, 0.95f, 0.4f),
                "TORSO" => new Color(0.4f, 0.8f, 1f),
                "PELVIS" => new Color(0.9f, 0.4f, 0.8f),
                "UPPER_ARM_L" => new Color(0.4f, 1f, 0.5f),
                "UPPER_ARM_R" => new Color(0.2f, 0.8f, 0.4f),
                "LOWER_ARM_L" => new Color(0.6f, 1f, 0.4f),
                "LOWER_ARM_R" => new Color(0.5f, 0.85f, 0.3f),
                "UPPER_LEG_L" => new Color(1f, 0.55f, 0.2f),
                "UPPER_LEG_R" => new Color(1f, 0.4f, 0.15f),
                "LOWER_LEG_L" => new Color(1f, 0.7f, 0.3f),
                "LOWER_LEG_R" => new Color(0.95f, 0.6f, 0.2f),
                "FOOT_L" => new Color(0.6f, 0.5f, 0.4f),
                "FOOT_R" => new Color(0.5f, 0.4f, 0.35f),
                "HAND_L" => new Color(0.95f, 0.8f, 0.7f),
                "HAND_R" => new Color(0.9f, 0.75f, 0.65f),
                _ => Color.magenta
            };
        }

        static void StripColliders(GameObject model)
        {
            if (model == null)
            {
                return;
            }

            foreach (var col in model.GetComponentsInChildren<Collider>(true))
            {
                if (Application.isPlaying)
                {
                    Object.Destroy(col);
                }
                else
                {
                    Object.DestroyImmediate(col);
                }
            }
        }

        static void TintSlot(Transform slot, Color color)
        {
            if (slot == null)
            {
                return;
            }

            var block = new MaterialPropertyBlock();
            foreach (var renderer in slot.GetComponentsInChildren<Renderer>(true))
            {
                renderer.GetPropertyBlock(block);
                block.SetColor("_BaseColor", color);
                block.SetColor("_Color", color);
                renderer.SetPropertyBlock(block);
            }
        }

        void DestroyNamed(string meshName)
        {
            if (visualRoot == null || string.IsNullOrEmpty(meshName))
            {
                return;
            }

            var found = visualRoot.GetComponentsInChildren<Transform>(true);
            for (var i = found.Length - 1; i >= 0; i--)
            {
                var child = found[i];
                if (child == null || child == visualRoot)
                {
                    continue;
                }

                if (child.name == meshName || child.name.StartsWith(meshName + "_") || child.name == meshName + "Static")
                {
                    if (Application.isPlaying)
                    {
                        Destroy(child.gameObject);
                    }
                    else
                    {
                        DestroyImmediate(child.gameObject);
                    }
                }
            }
        }

        static void Clear(Transform slot)
        {
            if (slot == null)
            {
                return;
            }

            for (var i = slot.childCount - 1; i >= 0; i--)
            {
                var child = slot.GetChild(i);
                if (Application.isPlaying)
                {
                    Destroy(child.gameObject);
                }
                else
                {
                    DestroyImmediate(child.gameObject);
                }
            }
        }

        static void RenameRenderers(GameObject model, string meshName)
        {
            var skins = model.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            for (var i = 0; i < skins.Length; i++)
            {
                skins[i].gameObject.name = i == 0 ? meshName : meshName + "_" + i;
            }

            var meshes = model.GetComponentsInChildren<MeshRenderer>(true);
            for (var i = 0; i < meshes.Length; i++)
            {
                if (meshes[i].GetComponent<SkinnedMeshRenderer>() == null)
                {
                    meshes[i].gameObject.name = meshName + "Static";
                }
            }
        }

        static AnimationClip First(AnimationClip[] clips)
        {
            return clips != null && clips.Length > 0 ? clips[0] : null;
        }

        void FitAssembledHeight()
        {
            if (visualRoot == null)
            {
                return;
            }

            visualRoot.localScale = Vector3.one;
            var bounds = RendererBounds(visualRoot);
            if (bounds.size.y < 0.1f || bounds.size.y > 4.5f)
            {
                return;
            }

            visualRoot.localScale *= WorldScale.HumanHeight / bounds.size.y;
            var after = RendererBounds(visualRoot);
            var pivotY = previewPivot != null ? previewPivot.position.y : transform.position.y;
            visualRoot.localPosition = new Vector3(0f, visualRoot.localPosition.y - (after.min.y - pivotY), 0f);
        }

        static void FitHeight(Transform model, float target)
        {
            var bounds = RendererBounds(model);
            if (bounds.size.y < 0.1f)
            {
                return;
            }

            model.localScale *= target / bounds.size.y;
            var after = RendererBounds(model);
            model.localPosition = new Vector3(0f, -after.min.y, 0f);
        }

        static Bounds RendererBounds(Transform model)
        {
            var bounds = new Bounds(model.position, Vector3.zero);
            var first = true;
            foreach (var renderer in model.GetComponentsInChildren<Renderer>())
            {
                if (first)
                {
                    bounds = renderer.bounds;
                    first = false;
                }
                else
                {
                    bounds.Encapsulate(renderer.bounds);
                }
            }

            return bounds;
        }

        static void EnableShadows(GameObject model)
        {
            foreach (var renderer in model.GetComponentsInChildren<Renderer>())
            {
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
                renderer.receiveShadows = true;
            }
        }

        public bool HasSkinnedMesh()
        {
            return visualRoot != null && visualRoot.GetComponentInChildren<SkinnedMeshRenderer>(true) != null;
        }

        public Renderer HairRenderer()
        {
            return FindNamedRenderer("HairMesh") ?? (hairSlot != null ? hairSlot.GetComponentInChildren<Renderer>(true) : null);
        }

        public Renderer ChestRenderer()
        {
            return FindNamedRenderer("ChestMesh") ?? (chestSlot != null ? chestSlot.GetComponentInChildren<Renderer>(true) : null);
        }

        public Renderer LegsRenderer()
        {
            return FindNamedRenderer("LegsMesh") ?? (legsSlot != null ? legsSlot.GetComponentInChildren<Renderer>(true) : null);
        }

        public Renderer BootsRenderer()
        {
            return FindNamedRenderer("BootsMesh") ?? (bootsSlot != null ? bootsSlot.GetComponentInChildren<Renderer>(true) : null);
        }

        public int VisibleHumanoidBodies()
        {
            var count = 0;
            if (visualRoot == null)
            {
                return 0;
            }

            foreach (var skin in visualRoot.GetComponentsInChildren<SkinnedMeshRenderer>(true))
            {
                if (!skin.gameObject.activeInHierarchy || skin.sharedMesh == null)
                {
                    continue;
                }

                if (skin.sharedMesh.vertexCount >= 20000 && skin.bounds.size.y >= 1.4f)
                {
                    count += 1;
                }
            }

            return count;
        }

        public int HeadRegionCount()
        {
            var count = 0;
            if (bodySlot == null)
            {
                return 0;
            }

            foreach (var t in bodySlot.GetComponentsInChildren<Transform>(true))
            {
                if (t.name == "Body_HEAD" && t.gameObject.activeInHierarchy)
                {
                    count += 1;
                }
            }

            return count;
        }

        Renderer FindNamedRenderer(string meshName)
        {
            if (visualRoot == null)
            {
                return null;
            }

            foreach (var t in visualRoot.GetComponentsInChildren<Transform>(true))
            {
                if (t.name == meshName || t.name.StartsWith(meshName + "_"))
                {
                    var renderer = t.GetComponent<Renderer>();
                    if (renderer != null)
                    {
                        return renderer;
                    }

                    renderer = t.GetComponentInChildren<Renderer>(true);
                    if (renderer != null)
                    {
                        return renderer;
                    }
                }
            }

            return null;
        }

        public Color CurrentBodyTint()
        {
            var renderer = bodySlot != null ? bodySlot.GetComponentInChildren<Renderer>(true) : null;
            if (renderer == null)
            {
                return Color.black;
            }

            var block = new MaterialPropertyBlock();
            renderer.GetPropertyBlock(block);
            return block.GetColor("_BaseColor");
        }
    }
}
