// Qualification only. Observe the editor and helper PIDs; retain no window titles.
#import <AppKit/AppKit.h>
#import <CoreGraphics/CoreGraphics.h>
int main(int argc, const char **argv) { @autoreleasepool {
    if (argc != 5) return 2;
    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyProhibited];
    int editor = atoi(argv[1]);
    NSString *profile = @(argv[2]), *stop = @(argv[3]), *output = @(argv[4]);
    NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
    if (workspace.frontmostApplication.processIdentifier != editor) return 3;
    NSMutableSet *targets = [NSMutableSet set];
    __block unsigned activations = 0;
    id token = [workspace.notificationCenter addObserverForName:NSWorkspaceDidActivateApplicationNotification object:nil queue:nil usingBlock:^(NSNotification *n) {
        if ([n.userInfo[NSWorkspaceApplicationKey] processIdentifier] != editor) activations++;
    }];
    [@"ready" writeToFile:[output stringByAppendingString:@".ready"] atomically:YES encoding:NSUTF8StringEncoding error:NULL];
    CFAbsoluteTime start = CFAbsoluteTimeGetCurrent(), last = start, gap = 0;
    unsigned samples = 0, helperSamples = 0, visible = 0, foreground = 0, failures = 0;
    while (CFAbsoluteTimeGetCurrent() - start < 90 && ![[NSFileManager defaultManager] fileExistsAtPath:stop]) {
        for (NSString *entry in [[NSFileManager defaultManager] contentsOfDirectoryAtPath:profile error:NULL]) {
            if ([entry hasPrefix:@"canvas-helper-"]) {
                NSString *pidPath = [[profile stringByAppendingPathComponent:entry] stringByAppendingPathComponent:@"helper.pid"];
                int pid = [[NSString stringWithContentsOfFile:pidPath encoding:NSUTF8StringEncoding error:NULL] intValue];
                if (pid > 0) [targets addObject:@(pid)];
            }
        }
        foreground += workspace.frontmostApplication.processIdentifier != editor;
        CFArrayRef info = CGWindowListCopyWindowInfo(kCGWindowListOptionAll | kCGWindowListExcludeDesktopElements, kCGNullWindowID);
        if (!info) failures++;
        else {
            BOOL editorVisible = NO;
            for (NSDictionary *window in (__bridge NSArray *)info) {
                if ([window[(id)kCGWindowOwnerPID] intValue] == editor && [window[(id)kCGWindowIsOnscreen] boolValue] && [window[(id)kCGWindowAlpha] doubleValue] > 0) editorVisible = YES;
                if ([targets containsObject:window[(id)kCGWindowOwnerPID]] && [window[(id)kCGWindowIsOnscreen] boolValue] && [window[(id)kCGWindowAlpha] doubleValue] > 0) visible++;
            }
            if (!editorVisible) failures++;
            CFRelease(info);
        }
        samples++;
        helperSamples += targets.count > 0;
        if (helperSamples == 11) [@"observed" writeToFile:[output stringByAppendingString:@".observed"] atomically:YES encoding:NSUTF8StringEncoding error:NULL];
        CFAbsoluteTime now = CFAbsoluteTimeGetCurrent(); gap = MAX(gap, now-last); last = now;
        CFRunLoopRunInMode(kCFRunLoopDefaultMode, 0.002, true);
    }
    [workspace.notificationCenter removeObserver:token];
    NSDictionary *receipt = @{@"editorPID":@(editor), @"helperPIDs":targets.allObjects, @"samples":@(samples), @"helperSamples":@(helperSamples), @"activationEventsObserved":@YES, @"visibleSamples":@(visible), @"foregroundChanges":@(foreground), @"activationChanges":@(activations), @"inventoryFailures":@(failures), @"maximumSampleGapMilliseconds":@(gap*1000), @"stopped":@([[NSFileManager defaultManager] fileExistsAtPath:stop])};
    [[NSJSONSerialization dataWithJSONObject:receipt options:NSJSONWritingPrettyPrinted error:NULL] writeToFile:output atomically:YES];
    return 0;
}}
