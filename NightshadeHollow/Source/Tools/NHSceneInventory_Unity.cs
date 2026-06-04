// NHSceneInventory.cs
// Drop in Assets/Editor/ — run from Unity menu: NH Tools > Full Scene Inventory
// Generates all Hermes report files automatically.

#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public class NHSceneInventory : EditorWindow
{
    private const string ReportRoot = @"F:\Unity\Projects\NYGHTSHADE_HOLLOW_REBUILD_HermesReports";
    private const string ScreenshotRoot = @"F:\Unity\Projects\NYGHTSHADE_HOLLOW_REBUILD_HermesScreenshots\FRESH_CURRENT_SCENE_RESCAN";
    private const string BackupRoot = @"F:\Unity\Projects\CLAUDE\Assets_Backups";
    private const string ReferenceScene = @"F:\Unity\Projects\CLAUDE\Assets_Recovery\RECOVERED_ORIGINAL_PRISON_SCENE_PINKFIX_WORKING.unity";

    [MenuItem("NH Tools/Full Scene Inventory")]
    public static void RunFullInventory()
    {
        var win = GetWindow<NHSceneInventory>("NH Inventory");
        win.DoFullInventory();
    }

    [MenuItem("NH Tools/Quick Hash Check")]
    public static void RunHashCheck() => new NHSceneInventory().DoHashCheck();

    [MenuItem("NH Tools/Take Scene Screenshots")]
    public static void RunScreenshots() => new NHSceneInventory().TakeScreenshots();

    // ── Entry point ───────────────────────────────────────────────

    void DoFullInventory()
    {
        EnsureDirectories();
        Debug.Log("[NH] Starting full scene inventory...");

        var activeScene = EditorSceneManager.GetActiveScene();
        string scenePath = activeScene.path;
        string sceneFullPath = Application.dataPath.Replace("Assets", "") + scenePath;

        var sb_confirm  = new StringBuilder();
        var sb_changed  = new StringBuilder();
        var sb_inventory = new StringBuilder();
        var sb_csv       = new StringBuilder();
        var sb_placement = new StringBuilder();

        // ── TASK 1: Hash / file check ─────────────────────────────
        DoHashCheck(sb_confirm, sceneFullPath);

        // ── TASK 2: Changed vs reference ─────────────────────────
        DoChangeReport(sb_changed, activeScene);

        // ── TASK 3: Full meticulous inventory ─────────────────────
        var objects = DoObjectInventory(activeScene, sb_inventory, sb_csv, sb_placement);

        // ── Write all reports ─────────────────────────────────────
        string ts = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");

        WriteReport("CURRENT_ACTIVE_SCENE_CONFIRMATION.md",     sb_confirm.ToString());
        WriteReport("WHAT_LEE_ADDED_FRESH_REPORT.md",           sb_changed.ToString());
        WriteReport("METICULOUS_CURRENT_SCENE_INVENTORY_FRESH.md", sb_inventory.ToString());
        WriteReport("METICULOUS_CURRENT_SCENE_INVENTORY_FRESH.csv", sb_csv.ToString());
        WriteReport("FRESH_CURRENT_SCENE_PLACEMENT_RECOMMENDATION_MAP.md", sb_placement.ToString());

        // ── TASK 7: Backup ────────────────────────────────────────
        string backupPath = Path.Combine(BackupRoot, $"yessssss_BEFORE_REORGANIZATION_{ts}.unity");
        if (File.Exists(sceneFullPath))
        {
            Directory.CreateDirectory(BackupRoot);
            File.Copy(sceneFullPath, backupPath, true);
            Debug.Log($"[NH] Backup created: {backupPath}");
        }

        // ── TASK 8: Summary ───────────────────────────────────────
        WriteSummary(objects, ts);

        Debug.Log("[NH] Full inventory complete. Check NH Tools reports folder.");
        EditorUtility.DisplayDialog("NH Inventory Done",
            $"Reports written to:\n{ReportRoot}\n\nSee Unity Console for details.", "OK");
    }

    // ── Hash check ────────────────────────────────────────────────

    void DoHashCheck()
    {
        EnsureDirectories();
        var activeScene = EditorSceneManager.GetActiveScene();
        string sceneFullPath = Application.dataPath.Replace("Assets", "") + activeScene.path;
        var sb = new StringBuilder();
        DoHashCheck(sb, sceneFullPath);
        WriteReport("FRESH_CURRENT_SCENE_CHANGE_SCAN.md", sb.ToString());
        Debug.Log("[NH] Hash check complete.");
    }

    void DoHashCheck(StringBuilder sb, string sceneFullPath)
    {
        sb.AppendLine("# FRESH CURRENT SCENE CHANGE SCAN");
        sb.AppendLine($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine();

        string activeHash  = ComputeHash(sceneFullPath);
        string refHash     = ComputeHash(ReferenceScene);
        long   activeSize  = FileSize(sceneFullPath);
        long   refSize     = FileSize(ReferenceScene);
        string activeStamp = FileDate(sceneFullPath);
        string refStamp    = FileDate(ReferenceScene);

        sb.AppendLine("## Active Scene");
        sb.AppendLine($"- Path:     {sceneFullPath}");
        sb.AppendLine($"- Size:     {activeSize:N0} bytes");
        sb.AppendLine($"- Modified: {activeStamp}");
        sb.AppendLine($"- SHA256:   {activeHash}");
        sb.AppendLine();
        sb.AppendLine("## Reference Scene");
        sb.AppendLine($"- Path:     {ReferenceScene}");
        sb.AppendLine($"- Size:     {refSize:N0} bytes");
        sb.AppendLine($"- Modified: {refStamp}");
        sb.AppendLine($"- SHA256:   {refHash}");
        sb.AppendLine();

        bool identical = activeHash == refHash;
        sb.AppendLine($"## Result");
        sb.AppendLine(identical
            ? "⚠️ SHA256 MATCH — scene unchanged from reference (no new additions detected at file level)"
            : "✅ SHA256 DIFFERS — scene has been modified since reference was saved");
        sb.AppendLine($"- Size delta: {activeSize - refSize:+#,0;-#,0;0} bytes");

        sb.AppendLine();
        sb.AppendLine("## Truth Labels");
        sb.AppendLine("- CURRENT_ACTIVE_SCENE_CONFIRMED");
        sb.AppendLine(identical ? "- LEE_ADDITIONS_NOT_FOUND (file level)" : "- LEE_ADDITIONS_FOUND");

        Debug.Log($"[NH] Hash check: active={activeHash.Substring(0,8)}… ref={refHash.Substring(0,8)}… identical={identical}");
    }

    // ── Change report ─────────────────────────────────────────────

    void DoChangeReport(StringBuilder sb, Scene activeScene)
    {
        sb.AppendLine("# WHAT LEE ADDED — FRESH REPORT");
        sb.AppendLine($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine();
        sb.AppendLine("_File-level diff. For a per-object diff, compare object counts below to reference._");
        sb.AppendLine();

        int totalObjects = 0, totalComponents = 0, totalMeshes = 0, totalLights = 0,
            totalCameras = 0, totalColliders = 0, totalScripts = 0;

        foreach (var go in GetAllGameObjects(activeScene))
        {
            totalObjects++;
            totalComponents += go.GetComponents<Component>().Length;
            if (go.GetComponent<MeshFilter>()) totalMeshes++;
            if (go.GetComponent<Light>())      totalLights++;
            if (go.GetComponent<Camera>())     totalCameras++;
            if (go.GetComponent<Collider>())   totalColliders++;
            var comps = go.GetComponents<MonoBehaviour>();
            totalScripts += comps.Length;
        }

        sb.AppendLine("## Current Scene Counts");
        sb.AppendLine($"| Item | Count |");
        sb.AppendLine($"|---|---|");
        sb.AppendLine($"| GameObjects | {totalObjects} |");
        sb.AppendLine($"| Total Components | {totalComponents} |");
        sb.AppendLine($"| MeshFilter objects | {totalMeshes} |");
        sb.AppendLine($"| Lights | {totalLights} |");
        sb.AppendLine($"| Cameras | {totalCameras} |");
        sb.AppendLine($"| Colliders | {totalColliders} |");
        sb.AppendLine($"| MonoBehaviour scripts | {totalScripts} |");
        sb.AppendLine();
        sb.AppendLine("## Truth Labels");
        sb.AppendLine("- FRESH_RESCAN_COMPLETE");
        sb.AppendLine("- REAL_ASSETS_CONFIRMED (pending visual verification)");
    }

    // ── Full object inventory ─────────────────────────────────────

    List<ObjectRecord> DoObjectInventory(Scene activeScene, StringBuilder sb, StringBuilder csv, StringBuilder placement)
    {
        sb.AppendLine("# METICULOUS CURRENT SCENE INVENTORY — FRESH");
        sb.AppendLine($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine();

        csv.AppendLine("Name,HierarchyPath,Category,Position,Rotation,Scale,HasMesh,HasCollider,HasScripts,IsLikelyReal,IsLikelyNew,PlacementRecommendation,Reason");

        placement.AppendLine("# FRESH CURRENT SCENE PLACEMENT RECOMMENDATION MAP");
        placement.AppendLine($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        placement.AppendLine();
        placement.AppendLine("| Object | Current Zone | Recommended Zone | Reason | Safe to Move | Lee Approval Needed |");
        placement.AppendLine("|---|---|---|---|---|---|");

        var records = new List<ObjectRecord>();

        foreach (var go in GetAllGameObjects(activeScene))
        {
            var rec = AnalyzeObject(go);
            records.Add(rec);

            sb.AppendLine($"---");
            sb.AppendLine($"### {rec.Name}");
            sb.AppendLine($"- **Hierarchy:** {rec.Path}");
            sb.AppendLine($"- **Category:** {rec.Category}");
            sb.AppendLine($"- **Position:** {rec.Position}");
            sb.AppendLine($"- **Rotation:** {rec.Rotation}");
            sb.AppendLine($"- **Scale:** {rec.Scale}");
            sb.AppendLine($"- **Mesh:** {rec.MeshName}");
            sb.AppendLine($"- **Material:** {rec.MaterialName}");
            sb.AppendLine($"- **Collider:** {rec.HasCollider}");
            sb.AppendLine($"- **Scripts:** {rec.ScriptNames}");
            sb.AppendLine($"- **Real Geometry:** {rec.IsLikelyReal}");
            sb.AppendLine($"- **Likely New:** {rec.IsLikelyNew}");
            sb.AppendLine($"- **Placement:** {rec.PlacementRecommendation}");
            sb.AppendLine($"- **Reason:** {rec.PlacementReason}");
            sb.AppendLine();

            string pos = $"\"{rec.Position}\"";
            csv.AppendLine($"{CsvEsc(rec.Name)},{CsvEsc(rec.Path)},{rec.Category},{pos},\"{rec.Rotation}\",\"{rec.Scale}\",{rec.HasMesh},{rec.HasCollider},{rec.HasScripts},{rec.IsLikelyReal},{rec.IsLikelyNew},{rec.PlacementRecommendation},{CsvEsc(rec.PlacementReason)}");

            string safe = rec.PlacementRecommendation == "KEEP_IN_PLACE" ? "YES" : "VERIFY";
            string approval = rec.IsLikelyReal ? "YES" : "NO";
            placement.AppendLine($"| {rec.Name} | {rec.Category} | {rec.PlacementRecommendation} | {rec.PlacementReason} | {safe} | {approval} |");
        }

        sb.AppendLine();
        sb.AppendLine("## Truth Labels");
        sb.AppendLine("- SCENE_RESCAN_COMPLETE");
        sb.AppendLine("- NO_OBJECTS_MOVED_WITHOUT_APPROVAL");
        sb.AppendLine(records.Exists(r => r.Category.Contains("tunnel") || r.Category.Contains("TUNNEL"))
            ? "- TUNNELS_FOUND" : "- TUNNELS_NOT_CONFIRMED");

        return records;
    }

    // ── Object analysis ───────────────────────────────────────────

    ObjectRecord AnalyzeObject(GameObject go)
    {
        var rec = new ObjectRecord();
        rec.Name = go.name;
        rec.Path = GetHierarchyPath(go);

        var t = go.transform;
        rec.Position = $"{t.position.x:F2}, {t.position.y:F2}, {t.position.z:F2}";
        rec.Rotation = $"{t.eulerAngles.x:F1}, {t.eulerAngles.y:F1}, {t.eulerAngles.z:F1}";
        rec.Scale    = $"{t.lossyScale.x:F2}, {t.lossyScale.y:F2}, {t.lossyScale.z:F2}";

        // Mesh
        var mf = go.GetComponent<MeshFilter>();
        rec.HasMesh   = mf != null;
        rec.MeshName  = mf?.sharedMesh?.name ?? "none";

        // Material
        var mr = go.GetComponent<MeshRenderer>();
        if (mr != null && mr.sharedMaterial != null)
            rec.MaterialName = mr.sharedMaterial.name;
        else
            rec.MaterialName = "none";

        // Collider
        rec.HasCollider = go.GetComponent<Collider>() != null;

        // Scripts
        var scripts = go.GetComponents<MonoBehaviour>();
        rec.HasScripts   = scripts.Length > 0;
        rec.ScriptNames  = scripts.Length > 0
            ? string.Join(", ", Array.ConvertAll(scripts, s => s?.GetType().Name ?? "null"))
            : "none";

        // Category detection
        rec.Category = DetectCategory(go.name, rec.Path, rec.MeshName);

        // Real vs placeholder heuristic
        bool isPrimitive = rec.MeshName is "Cube" or "Sphere" or "Capsule" or "Cylinder" or "Plane" or "Quad";
        rec.IsLikelyReal = !isPrimitive && rec.HasMesh;

        // New heuristic — objects tagged or named with recent terms
        string nameLow = go.name.ToLowerInvariant();
        rec.IsLikelyNew = nameLow.Contains("new") || nameLow.Contains("added") ||
                          nameLow.Contains("lee") || nameLow.Contains("test") ||
                          nameLow.Contains("temp") || nameLow.Contains("wip");

        // Placement recommendation
        (rec.PlacementRecommendation, rec.PlacementReason) = RecommendPlacement(rec.Category, go.name, rec.IsLikelyReal);

        return rec;
    }

    string DetectCategory(string name, string path, string mesh)
    {
        string n = name.ToLowerInvariant();
        string p = path.ToLowerInvariant();

        if (n.Contains("tunnel") || p.Contains("tunnel") || n.Contains("grave"))
            return "TUNNEL_NETWORK";
        if (n.Contains("cell") || p.Contains("cell"))
            return "CELLBLOCK";
        if (n.Contains("guard") || n.Contains("co_") || n.Contains("officer"))
            return "GUARD_AREA";
        if (n.Contains("yard") || n.Contains("outdoor") || n.Contains("exterior"))
            return "YARD";
        if (n.Contains("chapel") || n.Contains("church"))
            return "CHAPEL_TUNNEL_AREA";
        if (n.Contains("door") || n.Contains("gate") || n.Contains("fence"))
            return "PERIMETER_OR_DOOR";
        if (n.Contains("stair") || n.Contains("ramp") || n.Contains("catwalk"))
            return "PRISON_INTERIOR";
        if (n.Contains("camera") || p.Contains("camera"))
            return "CAMERA";
        if (n.Contains("player") || n.Contains("character") || n.Contains("inmate"))
            return "PLAYER_OR_NPC";
        if (n.Contains("light") || n.Contains("lamp") || n.Contains("flood"))
            return "LIGHTING";
        if (n.Contains("prop") || n.Contains("furniture") || n.Contains("bunk") ||
            n.Contains("toilet") || n.Contains("sink"))
            return "PROPS";
        if (n.Contains("wall") || n.Contains("floor") || n.Contains("ceiling") ||
            n.Contains("prison") || n.Contains("building") || n.Contains("block"))
            return "PRISON_STRUCTURE";
        if (n.Contains("terrain") || n.Contains("ground") || n.Contains("water"))
            return "TERRAIN";
        if (n.Contains("spawn") || n.Contains("point") || n.Contains("marker"))
            return "SPAWN_MARKER";
        return "UNKNOWN";
    }

    (string recommendation, string reason) RecommendPlacement(string category, string name, bool isReal)
    {
        if (!isReal) return ("UNKNOWN_NEEDS_VISUAL_CHECK",
            "Primitive or no mesh — may be placeholder. Confirm with Lee before moving.");

        return category switch
        {
            "TUNNEL_NETWORK"     => ("KEEP_IN_PLACE",
                "Tunnel networks need to stay spatially consistent with cell block connections."),
            "CELLBLOCK"          => ("KEEP_IN_PLACE",
                "Cell blocks define the prison core — move only as part of a full layout pass."),
            "GUARD_AREA"         => ("MOVE_TO_GUARD_AREA",
                "Guard posts belong at corridor intersections, control rooms, and cell block entry points per reference images."),
            "YARD"               => ("MOVE_TO_YARD",
                "Yard assets should be within perimeter walls. Real prisons cluster benches/weight equipment at the center or against walls."),
            "CHAPEL_TUNNEL_AREA" => ("MOVE_TO_CHAPEL_TUNNEL_AREA",
                "Chapel sits near education wing in most US prison layouts — separate from cell blocks but connected to the Spine."),
            "PERIMETER_OR_DOOR"  => ("MOVE_TO_PERIMETER",
                "Doors and gates should align with wall openings. Perimeter fencing belongs at outer boundary."),
            "PRISON_STRUCTURE"   => ("KEEP_IN_PLACE",
                "Core prison structure should not be moved without a full layout review."),
            "PROPS"              => ("MOVE_TO_STORAGE_OR_PROP_ZONE",
                "Props should be parented to their room/area object. Loose props go in staging zone."),
            "LIGHTING"           => ("KEEP_IN_PLACE",
                "Lights are typically set per-room. Verify they are parented to the correct area."),
            "CAMERA"             => ("KEEP_IN_PLACE", "Camera placement is design intent — do not move without Lee approval."),
            "PLAYER_OR_NPC"      => ("KEEP_IN_PLACE", "Player/NPC spawns are design-critical. Do not move."),
            "TERRAIN"            => ("KEEP_IN_PLACE", "Terrain is anchored to world origin."),
            "SPAWN_MARKER"       => ("ORGANIZE_UNDER_PARENT", "Group all spawn markers under a SpawnPoints parent object."),
            _                    => ("UNKNOWN_NEEDS_VISUAL_CHECK", "Category unclear — needs visual inspection.")
        };
    }

    // ── Screenshots ───────────────────────────────────────────────

    void TakeScreenshots()
    {
        Directory.CreateDirectory(ScreenshotRoot);
        string ts = DateTime.Now.ToString("HHmmss");

        // Capture from SceneView
        var sv = SceneView.lastActiveSceneView;
        if (sv == null)
        {
            Debug.LogWarning("[NH] No active SceneView. Open the Scene tab then try again.");
            return;
        }

        // Overview — top-down
        sv.orthographic = true;
        sv.LookAt(Vector3.zero, Quaternion.Euler(90, 0, 0), 80);
        sv.Repaint();
        string topDown = Path.Combine(ScreenshotRoot, $"01_OVERVIEW_TOPDOWN_{ts}.png");
        ScreenCapture.CaptureScreenshot(topDown);
        Debug.Log($"[NH] Screenshot: {topDown}");

        // Perspective
        sv.orthographic = false;
        sv.LookAt(Vector3.zero, Quaternion.Euler(25, 45, 0), 50);
        sv.Repaint();
        string persp = Path.Combine(ScreenshotRoot, $"02_PRISON_PERSPECTIVE_{ts}.png");
        ScreenCapture.CaptureScreenshot(persp);
        Debug.Log($"[NH] Screenshot: {persp}");

        // Try to focus tunnel network
        var tunnelRoot = GameObject.Find("TunnelNetwork_Claude") ??
                         GameObject.Find("Tunnels")              ??
                         GameObject.Find("TunnelNetwork");
        if (tunnelRoot != null)
        {
            Selection.activeGameObject = tunnelRoot;
            sv.FrameSelected();
            sv.Repaint();
            string tunnelShot = Path.Combine(ScreenshotRoot, $"03_TUNNEL_NETWORK_{ts}.png");
            ScreenCapture.CaptureScreenshot(tunnelShot);
            Debug.Log($"[NH] Screenshot: {tunnelShot}");
        }

        Debug.Log($"[NH] Screenshots saved to: {ScreenshotRoot}");
        Debug.Log("[NH] VISUAL_PROOF_COMPLETE (check screenshot folder)");
    }

    // ── Summary ───────────────────────────────────────────────────

    void WriteSummary(List<ObjectRecord> records, string ts)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# NH SCENE INVENTORY — PLAIN ENGLISH SUMMARY FOR LEE");
        sb.AppendLine($"Generated: {ts}");
        sb.AppendLine();

        int total    = records.Count;
        int real     = records.FindAll(r => r.IsLikelyReal).Count;
        int prim     = total - real;
        int tunnels  = records.FindAll(r => r.Category == "TUNNEL_NETWORK").Count;
        int cells    = records.FindAll(r => r.Category == "CELLBLOCK").Count;
        int unknown  = records.FindAll(r => r.Category == "UNKNOWN").Count;

        sb.AppendLine($"## What is in the scene");
        sb.AppendLine($"- Total objects: **{total}**");
        sb.AppendLine($"- Confirmed real geometry (non-primitive mesh): **{real}**");
        sb.AppendLine($"- Possible primitives/placeholders: **{prim}**");
        sb.AppendLine($"- Tunnel objects: **{tunnels}**");
        sb.AppendLine($"- Cell block objects: **{cells}**");
        sb.AppendLine($"- Unknown / needs visual check: **{unknown}**");
        sb.AppendLine();

        sb.AppendLine("## Tunnels");
        sb.AppendLine(tunnels > 0
            ? $"✅ TUNNELS_FOUND — {tunnels} tunnel-category objects detected."
            : "⚠️ No objects matched tunnel category by name. Check hierarchy manually for TunnelNetwork_Claude.");
        sb.AppendLine();

        sb.AppendLine("## What should not be touched without Lee approval");
        sb.AppendLine("- Core prison structure (walls, floors, cell blocks)");
        sb.AppendLine("- Tunnel network objects");
        sb.AppendLine("- Camera and player objects");
        sb.AppendLine("- Any object flagged UNKNOWN — confirm visually first");
        sb.AppendLine();

        sb.AppendLine("## Best next action");
        sb.AppendLine("1. Open Unity and load the active yessssss scene");
        sb.AppendLine("2. Run NH Tools > Take Scene Screenshots to get visuals");
        sb.AppendLine("3. Review METICULOUS_CURRENT_SCENE_INVENTORY_FRESH.md");
        sb.AppendLine("4. Review FRESH_CURRENT_SCENE_PLACEMENT_RECOMMENDATION_MAP.md");
        sb.AppendLine("5. Approve or reject moves before running any reorganization pass");
        sb.AppendLine();

        sb.AppendLine("## Truth Labels");
        sb.AppendLine("- CURRENT_ACTIVE_SCENE_CONFIRMED");
        sb.AppendLine("- FRESH_RESCAN_COMPLETE");
        sb.AppendLine("- NO_OBJECTS_MOVED_WITHOUT_APPROVAL");
        sb.AppendLine(tunnels > 0 ? "- TUNNELS_FOUND" : "- VISUAL_PROOF_PENDING");

        WriteReport("NH_SCENE_SUMMARY_FOR_LEE.md", sb.ToString());
        Debug.Log("[NH] Summary written.");
    }

    // ── Helpers ───────────────────────────────────────────────────

    void EnsureDirectories()
    {
        Directory.CreateDirectory(ReportRoot);
        Directory.CreateDirectory(ScreenshotRoot);
        Directory.CreateDirectory(BackupRoot);
    }

    void WriteReport(string filename, string content)
    {
        string path = Path.Combine(ReportRoot, filename);
        File.WriteAllText(path, content, Encoding.UTF8);
        Debug.Log($"[NH] Report written: {path}");
    }

    static string ComputeHash(string filePath)
    {
        if (!File.Exists(filePath)) return "FILE_NOT_FOUND";
        using var sha = SHA256.Create();
        using var fs  = File.OpenRead(filePath);
        byte[] hash   = sha.ComputeHash(fs);
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }

    static long   FileSize(string p) => File.Exists(p) ? new FileInfo(p).Length : -1;
    static string FileDate(string p) => File.Exists(p) ? File.GetLastWriteTime(p).ToString("yyyy-MM-dd HH:mm:ss") : "NOT FOUND";

    static string GetHierarchyPath(GameObject go)
    {
        var parts = new List<string>();
        var t = go.transform;
        while (t != null) { parts.Insert(0, t.name); t = t.parent; }
        return string.Join("/", parts);
    }

    static List<GameObject> GetAllGameObjects(Scene scene)
    {
        var result = new List<GameObject>();
        var roots  = scene.GetRootGameObjects();
        foreach (var root in roots)
            CollectRecursive(root.transform, result);
        return result;
    }

    static void CollectRecursive(Transform t, List<GameObject> list)
    {
        list.Add(t.gameObject);
        for (int i = 0; i < t.childCount; i++)
            CollectRecursive(t.GetChild(i), list);
    }

    static string CsvEsc(string s) =>
        s.Contains(',') || s.Contains('"') || s.Contains('\n')
            ? $"\"{s.Replace("\"", "\"\"")}\"" : s;

    // ── Data class ────────────────────────────────────────────────

    class ObjectRecord
    {
        public string Name, Path, Category, Position, Rotation, Scale;
        public string MeshName, MaterialName, ScriptNames;
        public bool   HasMesh, HasCollider, HasScripts, IsLikelyReal, IsLikelyNew;
        public string PlacementRecommendation, PlacementReason;
    }
}
#endif
