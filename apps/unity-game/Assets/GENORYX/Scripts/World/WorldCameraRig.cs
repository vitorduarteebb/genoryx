using UnityEngine;

namespace Genoryx
{
    /// <summary>3/4 elevada, estável, sem órbita livre. Zoom limitado. Mobile pinch opcional.</summary>
    public class WorldCameraRig : MonoBehaviour
    {
        public Transform target;
        public float pitch = 48f;
        public float yaw = 40f;
        public float distance = 20f;
        public float minDistance = 16f;
        public float maxDistance = 26f;
        public float follow = 5.2f;
        public float lookHeight = 1.5f;
        public WorldCameraState state = WorldCameraState.Exploration;
        float pinchPrev;
        float forcedUntil;

        public void ForceState(WorldCameraState next, float seconds = 1.2f)
        {
            state = next;
            forcedUntil = Time.time + seconds;
        }

        void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            if (Time.time > forcedUntil && WorldAreaManager.Instance != null)
            {
                state = WorldAreaManager.Instance.CameraForPlayer();
            }

            var desiredDistance = WorldAreaManager.Instance != null
                ? WorldAreaManager.Instance.DistanceFor(state)
                : HavenSliceBuilder.CameraDistance;
            HandleZoom();
            var stateBlend = Mathf.Lerp(distance, desiredDistance, Time.deltaTime * 2.4f);
            distance = Mathf.Clamp(stateBlend, minDistance, maxDistance);

            var rot = Quaternion.Euler(pitch, yaw, 0f);
            var origin = target.position + Vector3.up * 1.6f;
            var look = target.position + Vector3.up * lookHeight;
            if (state == WorldCameraState.Vista)
            {
                look += Vector3.forward * -3.2f;
            }

            if (state == WorldCameraState.EncounterFocus && WorldEncounterSystem.Instance != null && WorldEncounterSystem.Instance.Focus != null)
            {
                look = Vector3.Lerp(look, WorldEncounterSystem.Instance.Focus.transform.position + Vector3.up * 1.1f, 0.45f);
            }

            var desired = look + rot * (Vector3.back * distance);
            var dir = desired - origin;
            if (dir.sqrMagnitude > 0.01f && Physics.SphereCast(origin, 0.2f, dir.normalized, out var hit, dir.magnitude) && !hit.transform.IsChildOf(target))
            {
                desired = hit.point + hit.normal * 0.35f;
            }

            transform.position = Vector3.Lerp(transform.position, desired, Time.deltaTime * follow);
            transform.LookAt(look);
            var cam = GetComponent<Camera>();
            if (cam != null)
            {
                cam.fieldOfView = HavenSliceBuilder.CameraFov;
            }
        }

        void HandleZoom()
        {
            var scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.001f)
            {
                distance = Mathf.Clamp(distance - scroll * 4f, minDistance, maxDistance);
            }

            if (Input.touchCount == 2)
            {
                var a = Input.GetTouch(0).position;
                var b = Input.GetTouch(1).position;
                var gap = (a - b).magnitude;
                if (pinchPrev > 1f)
                {
                    distance = Mathf.Clamp(distance - (gap - pinchPrev) * 0.012f, minDistance, maxDistance);
                }

                pinchPrev = gap;
                return;
            }

            pinchPrev = 0f;
        }
    }
}
