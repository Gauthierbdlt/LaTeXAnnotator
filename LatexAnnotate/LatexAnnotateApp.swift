import SwiftUI

@main
struct LatexAnnotateApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.titleBar)
        .windowToolbarStyle(.unifiedCompact)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Ouvrir un document...") {
                    NotificationCenter.default.post(name: .openFileRequested, object: nil)
                }
                .keyboardShortcut("o", modifiers: .command)
                
                Button("Exporter en PDF annoté...") {
                    NotificationCenter.default.post(name: .exportPDFRequested, object: nil)
                }
                .keyboardShortcut("e", modifiers: .command)
            }
        }
    }
}
