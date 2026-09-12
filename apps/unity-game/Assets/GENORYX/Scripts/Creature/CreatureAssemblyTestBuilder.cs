using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Cena de teste do sistema de criaturas. Constroi tudo em runtime,
    /// para que a cena nunca fique dessincronizada do codigo.
    /// </summary>
    public class CreatureAssemblyTestBuilder : MonoBehaviour
    {
        public CreatureAssembler subject;
        public Transform orbit;
        /// <summary>Cede a camera para a captura automatica, que enquadra cada tomada.</summary>
        public bool cameraLocked;

        public float orbitDistance = 2.05f;
        public float orbitHeight = 0.72f;
        public float orbitAngle = 38f;

        readonly List<GameObject> crowd = new List<GameObject>();
        string log = "GENORYX CREATURE SYSTEM V1";
        Vector2 scroll;
        int randomSeed = 1;
        bool hudVisible = true;

        void Awake()
        {
            BuildScene();
            if (GetComponent<CreatureWebPreview>() == null && FindFirstObjectByType<CreatureWebPreview>() == null)
            {
                var preview = new GameObject(CreatureWebPreview.ObjectName);
                preview.AddComponent<CreatureWebPreview>();
            }
        }

        public void EnterEmbeddedPreview()
        {
            hudVisible = false;
            ClearCrowd();
            if (subject != null)
            {
                subject.gameObject.SetActive(true);
            }

            orbitDistance = 2.05f;
            orbitHeight = 0.72f;
            orbitAngle = 38f;
            FrameSubject();
        }

        public void ApplyDnaJson(string json)
        {
            BuildScene();
            EnterEmbeddedPreview();
            var dna = CreatureDNA.FromJson(json);
            if (subject == null)
            {
                log = "assembler ausente";
                return;
            }

            subject.ApplyDNA(dna);
            var secondary = subject.GetComponent<CreatureSecondaryMotion>();
            if (secondary != null)
            {
                secondary.Rebind();
            }

            log = dna.VisualSignature();
        }

        public void BuildScene()
        {
            if (subject != null)
            {
                return;
            }

            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.30f, 0.34f, 0.42f);
            RenderSettings.ambientEquatorColor = new Color(0.20f, 0.22f, 0.28f);
            RenderSettings.ambientGroundColor = new Color(0.22f, 0.23f, 0.28f);

            BuildGround();
            BuildLights();
            BuildCamera();

            var go = CreatureAssembler.Spawn("SubjectCreature", Vector3.zero, CreaturePresets.EmberDna());
            subject = go.GetComponent<CreatureAssembler>();
            go.AddComponent<CreatureMotor>();
            go.AddComponent<CreatureSecondaryMotion>();
            log = "Pronto. Chassi " + CreatureParts.ChassisV1 + " | combinacoes = " + CreatureParts.CombinationCount().ToString("N0");
        }

        void BuildGround()
        {
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.localScale = Vector3.one * 4f;
            var col = ground.GetComponent<Collider>();
            if (col != null)
            {
                Destroy(col);
            }

            var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
            var mat = new Material(shader) { name = "GroundMat", hideFlags = HideFlags.DontSave };
            if (mat.HasProperty("_BaseColor"))
            {
                mat.SetColor("_BaseColor", new Color(0.12f, 0.13f, 0.16f));
            }

            if (mat.HasProperty("_Smoothness"))
            {
                mat.SetFloat("_Smoothness", 0.12f);
            }

            ground.GetComponent<MeshRenderer>().sharedMaterial = mat;
        }

        void BuildLights()
        {
            var key = new GameObject("KeyLight").AddComponent<Light>();
            key.type = LightType.Directional;
            key.color = new Color(1f, 0.96f, 0.90f);
            key.intensity = 2.1f;
            key.shadows = LightShadows.Soft;
            key.transform.rotation = Quaternion.Euler(46f, 38f, 0f);

            var rim = new GameObject("RimLight").AddComponent<Light>();
            rim.type = LightType.Directional;
            rim.color = new Color(0.55f, 0.70f, 1f);
            rim.intensity = 0.85f;
            rim.shadows = LightShadows.None;
            rim.transform.rotation = Quaternion.Euler(18f, -142f, 0f);

            var fill = new GameObject("FillLight").AddComponent<Light>();
            fill.type = LightType.Directional;
            fill.color = new Color(0.85f, 0.85f, 0.95f);
            fill.intensity = 0.42f;
            fill.shadows = LightShadows.None;
            fill.transform.rotation = Quaternion.Euler(-14f, 200f, 0f);

            // Luz vinda de baixo. Sem ela a barriga e as pernas caiam em preto puro e nao
            // era possivel avaliar a silhueta inferior — o ponto mais importante do chassi.
            var bounce = new GameObject("BounceLight").AddComponent<Light>();
            bounce.type = LightType.Directional;
            bounce.color = new Color(0.62f, 0.66f, 0.78f);
            bounce.intensity = 0.95f;
            bounce.shadows = LightShadows.None;
            bounce.transform.rotation = Quaternion.Euler(-58f, 24f, 0f);
        }

        void BuildCamera()
        {
            var camObject = Camera.main != null ? Camera.main.gameObject : new GameObject("Main Camera");
            camObject.tag = "MainCamera";
            var cam = camObject.GetComponent<Camera>();
            if (cam == null)
            {
                cam = camObject.AddComponent<Camera>();
            }

            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.055f, 0.062f, 0.078f);
            cam.fieldOfView = 34f;
            cam.nearClipPlane = 0.05f;
            orbit = camObject.transform;
            FrameSubject();
        }

        public void FrameSubject()
        {
            if (orbit == null)
            {
                return;
            }

            var pivot = new Vector3(0f, orbitHeight * 0.52f, 0f);
            var rotation = Quaternion.Euler(14f, orbitAngle, 0f);

            // +Z porque a criatura olha para +Z: com -Z a HUD mostrava sempre a traseira.
            orbit.position = pivot + rotation * new Vector3(0f, orbitHeight * 0.45f, orbitDistance);
            orbit.LookAt(pivot);
        }

        void Update()
        {
            // A captura automatica assume a camera. Sem isto, este Update sobrescrevia o
            // enquadramento a cada frame e TODAS as capturas saiam do mesmo angulo.
            if (!cameraLocked)
            {
                FrameSubject();
            }

            if (Input.GetKeyDown(KeyCode.H))
            {
                hudVisible = !hudVisible;
            }
        }

        // ------------------------------------------------------------- ACTIONS

        public void Play(CreatureClip clip)
        {
            var animator = subject != null ? subject.Animator : null;
            if (animator == null || animator.runtimeAnimatorController == null)
            {
                log = "Animator ausente.";
                return;
            }

            var name = CreatureAnimationFactory.ClipName(clip);
            var motor = subject.GetComponent<CreatureMotor>();
            if (motor != null)
            {
                switch (clip)
                {
                    case CreatureClip.Walk:
                        animator.SetFloat(CreatureMotor.Param.Speed, 0.42f);
                        log = "WALK (Speed=0.42)";
                        return;
                    case CreatureClip.Run:
                        animator.SetFloat(CreatureMotor.Param.Speed, 1f);
                        log = "RUN (Speed=1.0)";
                        return;
                    case CreatureClip.Idle:
                        animator.SetFloat(CreatureMotor.Param.Speed, 0f);
                        log = "IDLE (Speed=0)";
                        return;
                }
            }

            animator.Play(name, 0, 0f);
            log = "PLAY " + name;
        }

        public void GenerateRandom()
        {
            randomSeed++;
            var dna = CreatureRandom.Generate(randomSeed);
            subject.ApplyDNA(dna);
            var validation = CreatureAssemblyValidator.Validate(subject);
            log = "RANDOM seed=" + randomSeed + "\n" + dna.VisualSignature() + "\n" + validation.Summary("random");
        }

        public void GenerateCrowd(int count)
        {
            ClearCrowd();
            var columns = Mathf.CeilToInt(Mathf.Sqrt(count));
            var spacing = 1.45f;
            var failures = 0;

            for (var i = 0; i < count; i++)
            {
                var row = i / columns;
                var col = i % columns;
                var position = new Vector3((col - (columns - 1) * 0.5f) * spacing, 0f, (row - (columns - 1) * 0.5f) * spacing);
                var dna = CreatureRandom.Generate(10_000 + i);
                var go = CreatureAssembler.Spawn("Crowd_" + i, position, dna);
                go.transform.rotation = Quaternion.Euler(0f, (i * 37f) % 360f, 0f);
                crowd.Add(go);

                var result = CreatureAssemblyValidator.Validate(go.GetComponent<CreatureAssembler>());
                if (!result.ok)
                {
                    failures++;
                    Debug.LogWarning("[GENORYX] " + result.Summary("crowd#" + i));
                }
            }

            if (subject != null)
            {
                subject.gameObject.SetActive(false);
            }

            var span = columns * spacing;
            if (orbit != null)
            {
                orbitDistance = span * 1.25f;
                orbitHeight = span * 0.62f;
            }

            log = "CROWD " + count + " montadas, falhas=" + failures;
            Debug.Log("[GENORYX] " + log);
        }

        public void ClearCrowd()
        {
            foreach (var go in crowd)
            {
                if (go != null)
                {
                    Destroy(go);
                }
            }

            crowd.Clear();
            if (subject != null)
            {
                subject.gameObject.SetActive(true);
            }

            orbitDistance = 2.05f;
            orbitHeight = 0.72f;
        }

        public void NextPart(CreatureSlot slot)
        {
            var current = subject.dna.Expressed(slot);
            var next = CreatureParts.Next(slot, current);
            switch (slot)
            {
                case CreatureSlot.Head: subject.SetHead(next); break;
                case CreatureSlot.Eyes: subject.SetEyes(next); break;
                case CreatureSlot.Horns: subject.SetHorns(next); break;
                case CreatureSlot.Limbs: subject.SetLimbs(next); break;
                case CreatureSlot.Tail: subject.SetTail(next); break;
                case CreatureSlot.Back: subject.SetBack(next); break;
                case CreatureSlot.Core: subject.SetCore(next); break;
                case CreatureSlot.Pattern: subject.SetPattern(next); break;
                case CreatureSlot.Aura: subject.SetAura(next); break;
            }

            log = slot + " -> " + next;
        }

        public void ApplyPreset(string preset)
        {
            subject.ApplyDNA(CreaturePresets.Get(preset));
            var secondary = subject.GetComponent<CreatureSecondaryMotion>();
            if (secondary != null)
            {
                secondary.Rebind();
            }

            log = "PRESET " + preset;
        }

        public void SetStage(CreatureGrowthStage stage)
        {
            subject.SetGrowthStage(stage);
            log = "GROWTH " + stage;
        }

        public void RunTests()
        {
            var lines = new List<string>
            {
                CreatureTestSuite.RunGeneration(10, 500, false),
                CreatureTestSuite.RunGeneration(100, 10_000, false),
                CreatureTestSuite.RunRuntimeSwapSequence(),
                CreatureTestSuite.RunSwapStress(1000, 77),
                CreatureTestSuite.RunAnimationDeformation(CreaturePresets.EmberDna(),
                    CreatureClip.Idle, CreatureClip.Walk, CreatureClip.Run,
                    CreatureClip.Attack01Body, CreatureClip.Hit, CreatureClip.Death)
            };

            log = string.Join("\n", lines);
            Debug.Log("[GENORYX][TESTS]\n" + log);
        }

        // ----------------------------------------------------------------- HUD

        void OnGUI()
        {
            if (!hudVisible)
            {
                return;
            }

            const float width = 232f;
            GUILayout.BeginArea(new Rect(10f, 10f, width, Screen.height - 20f), GUI.skin.box);
            scroll = GUILayout.BeginScrollView(scroll);

            GUILayout.Label("GENORYX CREATURE V1");

            GUILayout.Space(4f);
            GUILayout.Label("GENERATE");
            if (GUILayout.Button("GENERATE RANDOM")) GenerateRandom();
            if (GUILayout.Button("GENERATE 10")) GenerateCrowd(10);
            if (GUILayout.Button("GENERATE 100")) GenerateCrowd(100);
            if (GUILayout.Button("CLEAR")) ClearCrowd();

            GUILayout.Space(4f);
            GUILayout.Label("ANIMATION");
            if (GUILayout.Button("PLAY IDLE")) Play(CreatureClip.Idle);
            if (GUILayout.Button("PLAY WALK")) Play(CreatureClip.Walk);
            if (GUILayout.Button("PLAY RUN")) Play(CreatureClip.Run);
            if (GUILayout.Button("PLAY ATTACK")) Play(CreatureClip.Attack01Body);
            if (GUILayout.Button("PLAY CORE ATTACK")) Play(CreatureClip.Attack02Core);
            if (GUILayout.Button("PLAY HIT")) Play(CreatureClip.Hit);
            if (GUILayout.Button("PLAY DEATH")) Play(CreatureClip.Death);

            GUILayout.Space(4f);
            GUILayout.Label("GROWTH");
            if (GUILayout.Button("BABY")) SetStage(CreatureGrowthStage.Baby);
            if (GUILayout.Button("JUVENILE")) SetStage(CreatureGrowthStage.Juvenile);
            if (GUILayout.Button("ADULT")) SetStage(CreatureGrowthStage.Adult);

            GUILayout.Space(4f);
            GUILayout.Label("PARTS");
            if (GUILayout.Button("NEXT HEAD")) NextPart(CreatureSlot.Head);
            if (GUILayout.Button("NEXT EYES")) NextPart(CreatureSlot.Eyes);
            if (GUILayout.Button("NEXT HORNS")) NextPart(CreatureSlot.Horns);
            if (GUILayout.Button("NEXT LIMBS")) NextPart(CreatureSlot.Limbs);
            if (GUILayout.Button("NEXT TAIL")) NextPart(CreatureSlot.Tail);
            if (GUILayout.Button("NEXT BACK")) NextPart(CreatureSlot.Back);
            if (GUILayout.Button("NEXT CORE")) NextPart(CreatureSlot.Core);
            if (GUILayout.Button("NEXT PATTERN")) NextPart(CreatureSlot.Pattern);
            if (GUILayout.Button("NEXT AURA")) NextPart(CreatureSlot.Aura);

            GUILayout.Space(4f);
            GUILayout.Label("PRESETS");
            foreach (var preset in CreaturePresets.All)
            {
                if (GUILayout.Button(preset)) ApplyPreset(preset);
            }

            GUILayout.Space(4f);
            if (GUILayout.Button("RUN TEST SUITE")) RunTests();
            if (GUILayout.Button("TOGGLE SOCKETS")) subject.debugSockets = !subject.debugSockets;

            GUILayout.EndScrollView();
            GUILayout.EndArea();

            GUILayout.BeginArea(new Rect(width + 20f, 10f, Screen.width - width - 30f, 190f), GUI.skin.box);
            GUILayout.Label(log);
            GUILayout.EndArea();
        }
    }
}
