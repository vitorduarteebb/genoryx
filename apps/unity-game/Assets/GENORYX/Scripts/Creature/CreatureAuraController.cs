using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Auras sao VFX em runtime. Nunca bake no mesh.
    /// Um unico ParticleSystem persistente e reconfigurado na troca — sem vazar objetos.
    /// </summary>
    public class CreatureAuraController : MonoBehaviour
    {
        ParticleSystem system;
        ParticleSystemRenderer systemRenderer;
        Transform coreAnchor;
        string current = CreatureParts.AuraNone;

        public string Current => current;
        public bool Active => system != null && system.gameObject.activeSelf;

        public void Initialise(Transform anchor)
        {
            coreAnchor = anchor;
            if (system != null)
            {
                return;
            }

            var existing = transform.Find("AuraParticles");
            var go = existing != null ? existing.gameObject : new GameObject("AuraParticles");
            go.transform.SetParent(transform, false);
            go.transform.localPosition = new Vector3(0f, 0.30f, -0.08f);

            system = go.GetComponent<ParticleSystem>();
            if (system == null)
            {
                system = go.AddComponent<ParticleSystem>();
            }

            systemRenderer = go.GetComponent<ParticleSystemRenderer>();

            var main = system.main;
            main.loop = true;
            main.playOnAwake = false;
            main.simulationSpace = ParticleSystemSimulationSpace.Local;
            main.startLifetime = 1.1f;
            main.startSpeed = 0.22f;
            main.startSize = 0.05f;
            main.maxParticles = 64;
            main.scalingMode = ParticleSystemScalingMode.Hierarchy;

            var emission = system.emission;
            emission.rateOverTime = 14f;

            var shape = system.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = 0.34f;
            shape.radiusThickness = 0.55f;

            if (systemRenderer != null)
            {
                systemRenderer.renderMode = ParticleSystemRenderMode.Billboard;
                systemRenderer.material = AuraMaterial();
                systemRenderer.enabled = systemRenderer.material != null;
                systemRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                systemRenderer.receiveShadows = false;
            }

            go.SetActive(false);
        }

        static Material auraMaterial;
        static Texture2D auraSprite;

        static Material AuraMaterial()
        {
            if (auraMaterial != null)
            {
                return auraMaterial;
            }

            // GENORYX/Aura em vez dos shaders de particula do URP: neles o blend
            // transparente depende de estado que nao se troca por script, e o billboard
            // saia opaco no player. Shader.Find so enxerga o que o build incluiu, por
            // isso GenoryxWebGLBuild registra estes nomes em Always Included Shaders.
            var shader = Shader.Find("GENORYX/Aura")
                         ?? Shader.Find("Universal Render Pipeline/Particles/Unlit")
                         ?? Shader.Find("Sprites/Default");

            if (shader == null)
            {
                Debug.LogWarning("[GENORYX] nenhum shader de aura no build; VFX desligado");
                return null;
            }

            auraMaterial = new Material(shader)
            {
                name = "GENORYX_Aura",
                hideFlags = HideFlags.DontSave
            };

            // Billboard sem textura e um quadrado opaco. O gradiente radial e o que
            // transforma a particula em ponto de luz com borda suave.
            var sprite = AuraSprite();
            if (auraMaterial.HasProperty("_BaseMap"))
            {
                auraMaterial.SetTexture("_BaseMap", sprite);
            }
            if (auraMaterial.HasProperty("_MainTex"))
            {
                auraMaterial.SetTexture("_MainTex", sprite);
            }

            if (auraMaterial.HasProperty("_Surface"))
            {
                auraMaterial.SetFloat("_Surface", 1f);
                auraMaterial.SetFloat("_Blend", 1f);
                auraMaterial.renderQueue = 3000;
                auraMaterial.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            }

            return auraMaterial;
        }

        static Texture2D AuraSprite()
        {
            if (auraSprite != null)
            {
                return auraSprite;
            }

            const int size = 64;
            auraSprite = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                name = "GENORYX_AuraSprite",
                wrapMode = TextureWrapMode.Clamp,
                hideFlags = HideFlags.DontSave
            };

            var pixels = new Color32[size * size];
            var center = (size - 1) * 0.5f;
            for (var y = 0; y < size; y++)
            {
                for (var x = 0; x < size; x++)
                {
                    var dx = (x - center) / center;
                    var dy = (y - center) / center;
                    var distance = Mathf.Sqrt(dx * dx + dy * dy);
                    var alpha = Mathf.Clamp01(1f - distance);
                    alpha *= alpha;
                    var a = (byte)Mathf.RoundToInt(alpha * 255f);
                    pixels[y * size + x] = new Color32(255, 255, 255, a);
                }
            }

            auraSprite.SetPixels32(pixels);
            auraSprite.Apply(false, false);
            return auraSprite;
        }

        public void Apply(string auraId, Color elementColor)
        {
            if (system == null)
            {
                Initialise(coreAnchor);
            }

            current = string.IsNullOrEmpty(auraId) ? CreatureParts.AuraNone : auraId;

            if (current == CreatureParts.AuraNone)
            {
                system.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
                system.gameObject.SetActive(false);
                return;
            }

            var tint = AuraColor(current, elementColor);
            var main = system.main;
            main.startColor = new ParticleSystem.MinMaxGradient(tint, tint * 0.55f);

            switch (current)
            {
                case "AURA_EMBER":
                    main.startSpeed = 0.42f;
                    main.startLifetime = 0.9f;
                    main.startSize = 0.045f;
                    SetGravity(main, -0.22f);
                    SetRate(24f);
                    break;
                case "AURA_FROST":
                    main.startSpeed = 0.12f;
                    main.startLifetime = 1.8f;
                    main.startSize = 0.036f;
                    SetGravity(main, 0.05f);
                    SetRate(18f);
                    break;
                case "AURA_NATURE":
                    main.startSpeed = 0.16f;
                    main.startLifetime = 2.2f;
                    main.startSize = 0.030f;
                    SetGravity(main, 0.03f);
                    SetRate(16f);
                    break;
                case "AURA_VOID":
                    main.startSpeed = 0.28f;
                    main.startLifetime = 1.4f;
                    main.startSize = 0.055f;
                    SetGravity(main, -0.06f);
                    SetRate(22f);
                    break;
            }

            system.gameObject.SetActive(true);
            system.Play(true);
        }

        void SetGravity(ParticleSystem.MainModule main, float value)
        {
            main.gravityModifier = value;
        }

        void SetRate(float rate)
        {
            var emission = system.emission;
            emission.rateOverTime = rate;
        }

        static Color AuraColor(string auraId, Color fallback)
        {
            return auraId switch
            {
                "AURA_EMBER" => CreaturePalette.Get("ember"),
                "AURA_FROST" => CreaturePalette.Get("cyan_ice"),
                "AURA_NATURE" => CreaturePalette.Get("verdant"),
                "AURA_VOID" => CreaturePalette.Get("violet"),
                _ => fallback
            };
        }
    }
}
