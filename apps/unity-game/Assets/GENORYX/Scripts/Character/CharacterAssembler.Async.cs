using System.Threading.Tasks;
using UnityEngine;

namespace Genoryx
{
    public partial class CharacterAssembler
    {
        public async Task ApplyAppearanceAsync(CharacterAppearanceData data)
        {
            appearance = data ?? CharacterAppearanceData.Phase1();
            ready = false;
            lastError = null;
            applyVersion += 1;
            var token = applyVersion;
            CharacterPartCatalog.Ensure();
            if (!CharacterAssets.PlayerCharacterReady())
            {
                lastError = "Pipeline UnityReady/GLB ausente. Não uso PNG nem cápsula.";
                Debug.LogError("[GENORYX] " + lastError);
                return;
            }

            await EquipBodyAsync(token);
            if (token != applyVersion)
            {
                return;
            }

            await RefreshSlotAsync(hairSlot, appearance.hairId, "HairMesh");
            await RefreshSlotAsync(chestSlot, appearance.chestId, "ChestMesh");
            await RefreshSlotAsync(legsSlot, appearance.legsId, "LegsMesh");
            await RefreshSlotAsync(bootsSlot, appearance.bootsId, "BootsMesh");
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

        public Task SetHairAsync(string id)
        {
            appearance.hairId = id;
            return RefreshSlotAsync(hairSlot, id, "HairMesh");
        }

        public Task SetChestAsync(string id)
        {
            appearance.chestId = id;
            return RefreshSlotAsync(chestSlot, id, "ChestMesh");
        }

        async Task EquipBodyAsync(int token)
        {
            Clear(bodySlot);
            var lib = CharacterPartLibrary.Load();
            GameObject model;
            if (lib != null && lib.bodyPrefab != null)
            {
                model = Object.Instantiate(lib.bodyPrefab, bodySlot, false);
                model.name = "CanonicalBody";
            }
            else
            {
                var path = System.IO.File.Exists(CharacterPartCatalog.CanonicalBody())
                    ? CharacterPartCatalog.CanonicalBody()
                    : CharacterGltfLoader.Phase1File("tamer.rigged.glb");
                model = await CharacterGltfLoader.Instantiate(path, bodySlot, "CanonicalBody");
                model.name = "CanonicalBody";
            }

            if (token != applyVersion)
            {
                return;
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
        }

        async Task RefreshSlotAsync(Transform slot, string id, string meshName)
        {
            DestroyNamed(meshName);
            Clear(slot);
            var lib = CharacterPartLibrary.Load();
            var prefab = lib != null ? lib.Prefab(id) : null;
            GameObject model;
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
                    return;
                }

                var path = CharacterPartCatalog.GeneratedFile(part.file);
                if (!System.IO.File.Exists(path))
                {
                    Debug.LogWarning("[GENORYX] Peça 3D ausente: " + path);
                    return;
                }

                model = await CharacterGltfLoader.Instantiate(path, slot, meshName);
                model.name = meshName;
            }

            RenameRenderers(model, meshName);
            EnableShadows(model);
            StripColliders(model);
            ExpandSkinBounds(model);
            var skinned = model.GetComponentInChildren<SkinnedMeshRenderer>(true) != null;
            if (skinned)
            {
                BindPartToCanonicalAnimator(model);
            }

            if (slot == hairSlot)
            {
                BindHairMaterial();
                TintNamed("HairMesh", appearance.HairTint());
            }

            var renderer = slot.GetComponentInChildren<Renderer>(true);
            if (ModularRendererValidator.Validate(renderer, transform, meshName).StartsWith("OK"))
            {
                ApplyBodyMasks();
            }

            ApplyModularDebug();
            CharacterQuality.Apply(this);
        }
    }
}
