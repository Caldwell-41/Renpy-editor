// External qualification tool. Never linked into Loomlight or its signed package.
import AppKit
import CoreMedia
import CryptoKit
import ScreenCaptureKit

enum RecorderError: Error, CustomStringConvertible {
    case refused(String)
    var description: String { switch self { case let .refused(message): return message } }
}
func require(_ condition: Bool, _ message: String) throws {
    if !condition { throw RecorderError.refused(message) }
}
func json(_ value: Any) throws -> Data {
    try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
}
func digest(_ bytes: Data) -> String { SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined() }
func nanoseconds(_ ticks: UInt64) throws -> UInt64 {
    var info = mach_timebase_info_data_t()
    try require(mach_timebase_info(&info) == KERN_SUCCESS && info.denom != 0, "Mach timebase unavailable")
    let product = ticks.multipliedFullWidth(by: UInt64(info.numer))
    try require(product.high < UInt64(info.denom), "Clock conversion overflow")
    return UInt64(info.denom).dividingFullWidth(product).quotient
}
func now() throws -> UInt64 { try nanoseconds(mach_absolute_time()) }
func clockCheck() throws -> [String: Any] {
    let before = try now()
    let time = CMTimeConvertScale(CMClockGetTime(CMClockGetHostTimeClock()), timescale: 1_000_000_000, method: .default)
    let after = try now()
    try require(time.isValid && time.isNumeric && time.value >= 0, "CoreMedia host clock unavailable")
    let timestamp = UInt64(time.value)
    // CGEvent timestamps use nanoseconds since startup; SCK display times use mach ticks.
    try require(before <= timestamp && timestamp <= after && after - before < 10_000_000,
                "Native clock check failed (beforeNs=\(before), hostClockNs=\(timestamp), afterNs=\(after))")
    var info = mach_timebase_info_data_t(); mach_timebase_info(&info)
    return ["validated": true, "beforeNs": before, "hostClockNs": timestamp, "afterNs": after,
            "machNumer": info.numer, "machDenom": info.denom]
}
func permissions() -> [String: Bool] {
    ["screenCapture": CGPreflightScreenCaptureAccess(), "postEvent": CGPreflightPostEventAccess(),
     "accessibility": AXIsProcessTrusted()]
}

struct Crop: Codable {
    let x: Int, y: Int, width: Int, height: Int
    func validate() throws {
        try require(x >= 0 && y >= 0 && x <= 16384 && y <= 16384 && width > 0 && height > 0
                    && width <= 4096 && height <= 4096, "Invalid pixel crop")
    }
}
struct Sample: Codable { let id: String, series: String, sha256: String }
struct Focus: Codable { let role: String, label: String }
struct Action: Codable {
    let atMs: Double, kind: String
    let keyCode: UInt16?, modifiers: [String]?, x: Double?, y: Double?, sample: Sample?, focus: Focus?
}
struct Plan: Codable {
    let protocolVersion: Int, pid: Int32, windowID: UInt32, executableSHA256: String
    let endpoint: String, crop: Crop, actions: [Action]
    func validate() throws {
        try crop.validate()
        try require(protocolVersion == 1 && pid > 0 && windowID > 0, "Invalid target identity")
        try require(isHash(executableSHA256), "Executable SHA256 required")
        try require(["helper-content", "editing-guide", "reference"].contains(endpoint), "Unknown endpoint")
        try require((!actions.isEmpty || endpoint == "reference") && actions.count <= 2000, "Use 1 to 2000 actions for measurement")
        var last = -1.0, held = false, samples = Set<String>()
        for action in actions {
            try require(action.atMs.isFinite && action.atMs >= 0 && action.atMs > last
                        && action.atMs <= 110_000, "Actions must be strictly ordered within 110 seconds")
            last = action.atMs
            try require(["key", "down", "move", "up"].contains(action.kind), "Unknown input kind")
            if action.kind == "key" {
                try require(action.keyCode != nil && action.keyCode! < 128 && !held,
                            "Invalid key or key during a held pointer")
                try require(action.focus != nil && !action.focus!.role.isEmpty && !action.focus!.label.isEmpty,
                            "Keys require the expected focused control role and label")
                try require((action.modifiers ?? []).allSatisfy { ["command", "shift", "option", "control"].contains($0) },
                            "Unknown key modifier")
            } else {
                try require(action.modifiers?.isEmpty != false, "Pointer modifiers are unsupported")
                try require(action.x != nil && action.y != nil && action.x!.isFinite && action.y!.isFinite,
                            "Finite window-relative pointer coordinates required")
                if action.kind == "down" {
                    try require(!held && action.focus?.role.isEmpty == false && action.focus?.label.isEmpty == false,
                                "Pointer down requires a named control and no held button")
                    held = true
                }
                if action.kind == "up" { try require(held, "Pointer up without down"); held = false }
            }
            if let sample = action.sample {
                try require(sample.id.range(of: "^[A-Za-z0-9_-]{1,64}$", options: .regularExpression) != nil
                            && samples.insert(sample.id).inserted && isHash(sample.sha256), "Invalid or duplicate sample")
                try require(["text", "move", "resize"].contains(sample.series)
                            && ["key", "move"].contains(action.kind), "Sample must identify a text or gesture update")
                try require(sample.series == "text" ? action.kind == "key" : action.kind == "move" && held,
                            "Gesture samples require a held pointer; text samples require a key")
            }
        }
        try require(!held && (!samples.isEmpty || endpoint == "reference") && samples.count <= 1000,
                    "Finish every gesture and include measurement samples")
    }
}
func isHash(_ value: String) -> Bool {
    value.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil
}
func attribute(_ element: AXUIElement, _ key: String) throws -> CFTypeRef {
    var value: CFTypeRef?
    try require(AXUIElementCopyAttributeValue(element, key as CFString, &value) == .success && value != nil,
                "Required Accessibility attribute unavailable: \(key)")
    return value!
}
func verifyControl(_ focused: AXUIElement, _ expected: Focus, bounds: CGRect) throws {
    try require(try attribute(focused, kAXRoleAttribute) as? String == expected.role,
                "Focused control role differs from plan")
    try require(try attribute(focused, kAXEnabledAttribute) as? Bool == true, "Focused control disabled")
    let labels = [kAXDescriptionAttribute, kAXTitleAttribute, kAXHelpAttribute].compactMap {
        try? attribute(focused, $0) as? String
    }
    try require(labels.contains(expected.label), "Focused control label differs from plan")
    let position = try attribute(focused, kAXPositionAttribute), size = try attribute(focused, kAXSizeAttribute)
    try require(CFGetTypeID(position) == AXValueGetTypeID() && CFGetTypeID(size) == AXValueGetTypeID(),
                "Focused control geometry unavailable")
    var origin = CGPoint.zero, extent = CGSize.zero
    try require(AXValueGetValue(unsafeBitCast(position, to: AXValue.self), .cgPoint, &origin)
                && AXValueGetValue(unsafeBitCast(size, to: AXValue.self), .cgSize, &extent), "Invalid focus geometry")
    let rect = CGRect(origin: origin, size: extent)
    try require(rect.width > 0 && rect.height > 0 && bounds.contains(rect), "Focused control outside owned viewport")
}
func verifyFocus(_ pid: pid_t, _ expected: Focus, bounds: CGRect) throws {
    let raw = try attribute(AXUIElementCreateApplication(pid), kAXFocusedUIElementAttribute)
    try require(CFGetTypeID(raw) == AXUIElementGetTypeID(), "No focused control")
    try verifyControl(unsafeBitCast(raw, to: AXUIElement.self), expected, bounds: bounds)
}
func verifyPointer(_ pid: pid_t, _ point: CGPoint, _ expected: Focus, bounds: CGRect) throws {
    var hit: AXUIElement?
    try require(AXUIElementCopyElementAtPosition(AXUIElementCreateApplication(pid), Float(point.x), Float(point.y), &hit) == .success
                && hit != nil, "Pointer target unavailable")
    try verifyControl(hit!, expected, bounds: bounds)
}

// Pixel/status mutation stays on the serial capture queue; metrics and close follow its drain.
// Cross-thread observers use only fail/check, whose shared state is protected by the lock.
final class Capture: NSObject, SCStreamOutput, SCStreamDelegate, @unchecked Sendable {
    let root: URL, crop: Crop, log: FileHandle
    private let lock = NSLock()
    private var error: String?, completeFrames = 0, totalBytes = 0
    private var hashes = Set<String>(), statuses: [Int: Int] = [:]
    private var lastArrival: UInt64 = 0, maximumArrivalGap: UInt64 = 0
    func metrics() -> [String: Any] {
        ["frameStatuses": Dictionary(uniqueKeysWithValues: statuses.map { (String($0.key), $0.value) }),
         "retainedBytes": totalBytes, "completeFrames": completeFrames, "maximumCallbackGapNs": maximumArrivalGap]
    }
    init(root: URL, crop: Crop) throws {
        self.root = root; self.crop = crop
        let file = root.appendingPathComponent("frames.jsonl")
        FileManager.default.createFile(atPath: file.path, contents: nil, attributes: [.posixPermissions: 0o600])
        log = try FileHandle(forWritingTo: file)
    }
    func fail(_ message: String) { lock.lock(); defer { lock.unlock() }; if error == nil { error = message } }
    func check() throws -> Int {
        lock.lock(); defer { lock.unlock() }
        if let error { throw RecorderError.refused(error) }; return completeFrames
    }
    func stream(_ stream: SCStream, didStopWithError error: Error) { fail("Capture stream stopped: \(error)") }
    func stream(_ stream: SCStream, didOutputSampleBuffer buffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .screen else { fail("Unexpected non-screen stream"); return }
        do {
            let arrival = try now()
            guard let attachments = CMSampleBufferGetSampleAttachmentsArray(buffer, createIfNecessary: false) as? [[SCStreamFrameInfo: Any]],
                  let status = attachments.first?[.status] as? Int else { throw RecorderError.refused("Missing frame status") }
            statuses[status, default: 0] += 1
            if lastArrival > 0 { maximumArrivalGap = max(maximumArrivalGap, arrival - lastArrival) }
            lastArrival = arrival
            if status == SCFrameStatus.idle.rawValue { return }
            if status == SCFrameStatus.started.rawValue || status == SCFrameStatus.stopped.rawValue { return }
            try require(status == SCFrameStatus.complete.rawValue && CMSampleBufferDataIsReady(buffer), "Incomplete or suspended capture")
            guard let tick = attachments.first?[.displayTime] as? UInt64,
                  let pixels = CMSampleBufferGetImageBuffer(buffer) else { throw RecorderError.refused("Missing display time or pixels") }
            let displayed = try nanoseconds(tick)
            try require(displayed <= arrival, "Frame is ahead of the recorder clock")
            try require(CVPixelBufferGetPixelFormatType(pixels) == kCVPixelFormatType_32BGRA, "Unexpected capture format")
            let width = CVPixelBufferGetWidth(pixels), height = CVPixelBufferGetHeight(pixels)
            try require(crop.x + crop.width <= width && crop.y + crop.height <= height, "Crop outside captured window")
            try require(CVPixelBufferLockBaseAddress(pixels, .readOnly) == kCVReturnSuccess, "Cannot lock captured pixels")
            defer { CVPixelBufferUnlockBaseAddress(pixels, .readOnly) }
            guard let base = CVPixelBufferGetBaseAddress(pixels) else { throw RecorderError.refused("No captured pixel memory") }
            let stride = CVPixelBufferGetBytesPerRow(pixels)
            var bytes = Data(count: crop.width * crop.height * 4)
            bytes.withUnsafeMutableBytes { destination in
                let out = destination.bindMemory(to: UInt8.self).baseAddress!
                let source = base.assumingMemoryBound(to: UInt8.self)
                for y in 0..<crop.height { for x in 0..<crop.width {
                    let i = (y * crop.width + x) * 4, j = (y + crop.y) * stride + (x + crop.x) * 4
                    out[i] = source[j + 2]; out[i + 1] = source[j + 1]; out[i + 2] = source[j]; out[i + 3] = source[j + 3]
                } }
            }
            let hash = digest(bytes)
            if hashes.insert(hash).inserted {
                totalBytes += bytes.count
                try require(totalBytes <= 1_073_741_824, "Capture exceeded 1GiB retained pixel limit")
                let file = root.appendingPathComponent("frames/\(hash).rgba")
                try bytes.write(to: file, options: .atomic)
                try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: file.path)
            }
            let row: [String: Any] = ["displayNs": displayed, "arrivalNs": arrival, "sha256": hash,
                                      "width": crop.width, "height": crop.height]
            try log.write(contentsOf: json(row) + Data([10]))
            lock.lock(); completeFrames += 1; let count = completeFrames; lock.unlock()
            try require(count <= 20000, "Capture exceeded frame limit")
        } catch { fail(String(describing: error)) }
    }
}

@available(macOS 14.0, *)
@MainActor func target(_ plan: Plan, original: CGRect? = nil) throws -> CGRect {
    guard let console = CGSessionCopyCurrentDictionary() as? [String: Any] else {
        throw RecorderError.refused("Console session unavailable")
    }
    try require(console["kCGSessionOnConsoleKey"] as? Bool == true
                && console["CGSSessionScreenIsLocked"] as? Bool != true, "Unlocked console required")
    guard let app = NSRunningApplication(processIdentifier: plan.pid),
          let executable = app.executableURL else { throw RecorderError.refused("Target process unavailable") }
    try require(!app.isTerminated && NSWorkspace.shared.frontmostApplication?.processIdentifier == plan.pid,
                "Target must own the foreground")
    if original == nil {
        try require(digest(try Data(contentsOf: executable)) == plan.executableSHA256, "Target executable changed")
    }
    guard let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]],
          let front = windows.first(where: { ($0[kCGWindowLayer as String] as? Int) == 0
              && ($0[kCGWindowAlpha as String] as? Double ?? 0) > 0 }),
          front[kCGWindowOwnerPID as String] as? Int32 == plan.pid,
          front[kCGWindowNumber as String] as? UInt32 == plan.windowID,
          let bounds = front[kCGWindowBounds as String] as? [String: Any],
          let rect = CGRect(dictionaryRepresentation: bounds as CFDictionary) else { throw RecorderError.refused("Owned window must be frontmost and on screen") }
    if let original { try require(rect == original, "Target window moved or resized during measurement") }
    for above in windows.prefix(while: { $0[kCGWindowNumber as String] as? UInt32 != plan.windowID }) {
        if (above[kCGWindowAlpha as String] as? Double ?? 0) > 0,
           let raw = above[kCGWindowBounds as String] as? [String: Any],
           let area = CGRect(dictionaryRepresentation: raw as CFDictionary), area.intersects(rect) {
            throw RecorderError.refused("Another visible window overlaps the target")
        }
    }
    return rect
}

@available(macOS 14.0, *)
@MainActor func record(_ plan: Plan, planBytes: Data, output: URL) async throws {
    try require(permissions().values.allSatisfy { $0 }, "Permissions unavailable; no capture or input attempted")
    let clock = try clockCheck(), bounds = try target(plan)
    try require(!CGEventSource.buttonState(.combinedSessionState, button: .left)
                && !CGEventSource.buttonState(.combinedSessionState, button: .right), "Release physical pointer buttons first")
    let manager = FileManager.default
    try require(!manager.fileExists(atPath: output.path), "Output must not already exist")
    try manager.createDirectory(at: output, withIntermediateDirectories: false, attributes: [.posixPermissions: 0o700])
    try manager.createDirectory(at: output.appendingPathComponent("frames"), withIntermediateDirectories: false, attributes: [.posixPermissions: 0o700])
    try planBytes.write(to: output.appendingPathComponent("plan.json"), options: .atomic)
    let inputURL = output.appendingPathComponent("inputs.jsonl")
    manager.createFile(atPath: inputURL.path, contents: nil, attributes: [.posixPermissions: 0o600])
    let inputs = try FileHandle(forWritingTo: inputURL)
    var session: [String: Any] = ["protocol": 1, "complete": false, "clockValidated": true, "clock": clock,
        "pid": plan.pid, "windowID": plan.windowID, "executableSHA256": plan.executableSHA256,
        "recorderSHA256": digest(try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[0]))),
        "os": ProcessInfo.processInfo.operatingSystemVersionString,
        "inputKind": plan.actions.isEmpty ? "capture-only-reference" : "os-injected", "inputTimeEndpoint": "before-post",
        "webViewRuntime": Bundle(path: "/System/Library/Frameworks/WebKit.framework")?.object(forInfoDictionaryKey: "CFBundleVersion") as Any? ?? NSNull(),
        "frameRateRequested": 60, "pixelFormat": "RGBA8-premultiplied", "permissionsRequested": false,
        "nativePresentationQualified": false]
    var stream: SCStream?, heldPoint: CGPoint?, keyMonitor: Any?, activationObserver: NSObjectProtocol?
    var failures = [String: String]()
    let queue = DispatchQueue(label: "loomlight.measurement.capture")
    let capture = try Capture(root: output, crop: plan.crop)
    let signals = [SIGINT, SIGTERM].map { number -> DispatchSourceSignal in
        signal(number, SIG_IGN)
        let source = DispatchSource.makeSignalSource(signal: number, queue: .main)
        source.setEventHandler { capture.fail("Recorder interrupted") }; source.resume(); return source
    }
    defer { signals.forEach { $0.cancel() }; signal(SIGINT, SIG_DFL); signal(SIGTERM, SIG_DFL) }
    defer {
        if let keyMonitor { NSEvent.removeMonitor(keyMonitor) }
        if let activationObserver { NSWorkspace.shared.notificationCenter.removeObserver(activationObserver) }
    }
    @MainActor func checkRun() throws {
        // A CLI has no NSApplication.run loop. Service AppKit's asynchronous monitors here.
        CFRunLoopRunInMode(.defaultMode, 0.0005, true)
        _ = try capture.check(); _ = try target(plan, original: bounds)
        if CGEventSource.keyState(.combinedSessionState, key: 53) { capture.fail("Escape requested recorder stop") }
        _ = try capture.check()
    }
    @MainActor func waitUntil(_ deadline: UInt64) async throws {
        while true {
            try checkRun()
            let current = try now()
            if current >= deadline { return }
            try await Task.sleep(nanoseconds: min(5_000_000, deadline - current))
        }
    }
    do {
        let displays = NSScreen.screens.compactMap { screen -> [String: Any]? in
            guard let number = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? UInt32,
                  CGDisplayBounds(number).contains(bounds) else { return nil }
            let hz = CGDisplayCopyDisplayMode(number)?.refreshRate ?? 0
            return ["displayID": number, "widthPixels": CGDisplayPixelsWide(number), "heightPixels": CGDisplayPixelsHigh(number),
                    "reportedRefreshHz": hz > 0 ? hz as Any : NSNull()]
        }
        try require(displays.count == 1, "Keep the target window on one measured display")
        session["display"] = displays[0]
        _ = NSApplication.shared.setActivationPolicy(.prohibited)
        keyMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            if event.keyCode == 53 { capture.fail("Escape requested recorder stop") }
        }
        try require(keyMonitor != nil, "Escape monitor unavailable")
        activationObserver = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main) { notification in
                if let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication,
                   app.processIdentifier != plan.pid { capture.fail("Target lost foreground ownership") }
            }
        let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
        guard let window = content.windows.first(where: { $0.windowID == plan.windowID && $0.owningApplication?.processID == plan.pid }) else {
            throw RecorderError.refused("Target not in shareable window inventory")
        }
        let filter = SCContentFilter(desktopIndependentWindow: window)
        let config = SCStreamConfiguration()
        config.width = Int((filter.contentRect.width * CGFloat(filter.pointPixelScale)).rounded())
        config.height = Int((filter.contentRect.height * CGFloat(filter.pointPixelScale)).rounded())
        config.pixelFormat = kCVPixelFormatType_32BGRA; config.colorSpaceName = CGColorSpace.sRGB
        config.minimumFrameInterval = CMTime(value: 1, timescale: 60)
        config.queueDepth = 8; config.capturesAudio = false; config.showsCursor = false; config.ignoreShadowsSingleWindow = true
        session["windowPixels"] = [config.width, config.height]
        session["windowBounds"] = [bounds.minX, bounds.minY, bounds.width, bounds.height]
        session["pointPixelScale"] = filter.pointPixelScale
        let active = SCStream(filter: filter, configuration: config, delegate: capture); stream = active
        try active.addStreamOutput(capture, type: .screen, sampleHandlerQueue: queue)
        try await active.startCapture()
        let deadline = try now() + 5_000_000_000
        while try capture.check() == 0 {
            try checkRun()
            try require(try now() < deadline, "No initial captured frame within five seconds")
            try await Task.sleep(nanoseconds: 5_000_000)
        }
        let start = try now() + 100_000_000
        session["inputStartNs"] = start
        for action in plan.actions {
            let scheduled = start + UInt64(action.atMs * 1_000_000)
            try await waitUntil(scheduled)
            let event: CGEvent, release: CGEvent?, pointerPoint: CGPoint?
            if action.kind == "key" {
                try verifyFocus(plan.pid, action.focus!, bounds: bounds)
                guard let down = CGEvent(keyboardEventSource: nil, virtualKey: action.keyCode!, keyDown: true),
                      let up = CGEvent(keyboardEventSource: nil, virtualKey: action.keyCode!, keyDown: false) else {
                    throw RecorderError.refused("Cannot create key input")
                }
                var flags = CGEventFlags()
                for flag in action.modifiers ?? [] {
                    flags.insert(["command": .maskCommand, "shift": .maskShift, "option": .maskAlternate, "control": .maskControl][flag]!)
                }
                down.flags = flags; up.flags = flags; event = down; release = up; pointerPoint = nil
            } else {
                let point = CGPoint(x: bounds.minX + action.x!, y: bounds.minY + action.y!)
                try require(bounds.contains(point), "Pointer input outside target window")
                if action.kind == "down" { try verifyPointer(plan.pid, point, action.focus!, bounds: bounds) }
                let kind: CGEventType = action.kind == "down" ? .leftMouseDown : action.kind == "up" ? .leftMouseUp
                    : heldPoint == nil ? .mouseMoved : .leftMouseDragged
                guard let mouse = CGEvent(mouseEventSource: nil, mouseType: kind, mouseCursorPosition: point, mouseButton: .left) else {
                    throw RecorderError.refused("Cannot create pointer input")
                }
                mouse.flags = []; event = mouse; release = nil; pointerPoint = point
            }
            try checkRun()
            let before = try now(); event.timestamp = before; event.post(tap: .cghidEventTap)
            release?.timestamp = before
            release?.post(tap: .cghidEventTap)
            let after = try now()
            if let point = pointerPoint, action.kind == "down" || heldPoint != nil {
                heldPoint = action.kind == "up" ? nil : point
            }
            var row: [String: Any] = ["id": action.sample?.id as Any? ?? NSNull(), "kind": action.kind,
                "nativeType": event.type.rawValue, "eventNs": event.timestamp,
                "modifiers": event.flags.rawValue,
                "scheduledNs": scheduled, "beforeNs": before, "afterNs": after]
            if action.kind == "key" {
                row["keyCode"] = event.getIntegerValueField(.keyboardEventKeycode)
            } else { row["pointX"] = event.location.x; row["pointY"] = event.location.y }
            try inputs.write(contentsOf: json(row) + Data([10]))
        }
        try await waitUntil(try now() + 1_000_000_000)
        session["complete"] = true
    } catch { failures["operation"] = String(describing: error) }
    var cleanup: [String: Any] = ["pointerReleaseRequired": heldPoint != nil, "pointerReleasePosted": false,
                                  "streamStopAttempted": stream != nil, "streamStopComplete": stream == nil]
    if let point = heldPoint {
        // Release only the button this tool pressed, even if focus was lost.
        if let release = CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left) {
            release.post(tap: .cghidEventTap); cleanup["pointerReleasePosted"] = true
        } else { failures["pointerRelease"] = "Cannot create owned mouse release" }
    }
    if let stream {
        do { try await stream.stopCapture(); cleanup["streamStopComplete"] = true }
        catch { failures["captureStop"] = String(describing: error) }
    }
    queue.sync {} // Drain all pixel writes before closing the receipt.
    session["capture"] = capture.metrics()
    do { _ = try capture.check() } catch { failures["captureDrain"] = String(describing: error) }
    do { try capture.log.close() } catch { failures["captureLogClose"] = String(describing: error) }
    do { try inputs.close() } catch { failures["inputLogClose"] = String(describing: error) }
    session["cleanup"] = cleanup; session["failures"] = failures
    session["complete"] = session["complete"] as? Bool == true && failures.isEmpty
    session["failure"] = failures["operation"] ?? failures.keys.sorted().first.flatMap { failures[$0] }
    try json(session).write(to: output.appendingPathComponent("session.json"), options: .atomic)
    try require(session["complete"] as? Bool == true, session["failure"] as? String ?? "Incomplete recording")
}

@main struct Main {
    @MainActor static func main() async {
        do {
            let args = CommandLine.arguments
            if args.count == 2 && args[1] == "preflight" {
                let access = permissions()
                var report: [String: Any] = ["permissions": access, "permissionRequestsMade": false,
                    "captureAttempted": false, "inputPosted": false]
                do { report["clock"] = try clockCheck() } catch { report["clockError"] = String(describing: error) }
                print(String(decoding: try json(report), as: UTF8.self))
                exit(access.values.allSatisfy { $0 } && report["clock"] != nil ? 0 : 3)
            }
            try require(args.count == 3 || args.count == 4, "Usage: recorder preflight | validate PLAN | record PLAN NEW_OUTPUT")
            let bytes = try Data(contentsOf: URL(fileURLWithPath: args[2]))
            let plan = try JSONDecoder().decode(Plan.self, from: bytes); try plan.validate()
            if args[1] == "validate" && args.count == 3 { print("Plan valid; no permissions requested, capture started or input posted."); return }
            try require(args[1] == "record" && args.count == 4, "Unknown command")
            if #available(macOS 14.0, *) { try await record(plan, planBytes: bytes, output: URL(fileURLWithPath: args[3])) }
            else { throw RecorderError.refused("macOS 14 or later required") }
        } catch { FileHandle.standardError.write(Data("Recorder refused: \(error)\n".utf8)); exit(1) }
    }
}
