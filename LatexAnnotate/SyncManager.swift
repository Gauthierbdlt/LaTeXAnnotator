import Foundation
import MultipeerConnectivity
import Combine

/// Message échangé en temps réel entre le MacBook et l'iPad
public struct LiveCanvasAction: Codable {
    public enum ActionType: String, Codable {
        case drawStroke
        case addLatex
        case addImage
        case pageChange
        case clear
    }
    
    public var type: ActionType
    public var pageIndex: Int
    public var points: [CGPoint]?
    public var colorHex: String?
    public var strokeWidth: CGFloat?
    public var isHighlighter: Bool?
    public var latexCode: String?
    public var timestamp: TimeInterval
    
    public init(type: ActionType, pageIndex: Int, points: [CGPoint]? = nil, colorHex: String? = nil, strokeWidth: CGFloat? = nil, isHighlighter: Bool? = nil, latexCode: String? = nil) {
        self.type = type
        self.pageIndex = pageIndex
        self.points = points
        self.colorHex = colorHex
        self.strokeWidth = strokeWidth
        self.isHighlighter = isHighlighter
        self.latexCode = latexCode
        self.timestamp = Date().timeIntervalSince1970
    }
}

/// Gestionnaire de synchronisation directe Mac <-> iPad via Apple MultipeerConnectivity (Wi-Fi / Bluetooth direct, sans cloud ni latence)
public class SyncManager: NSObject, ObservableObject {
    public static let shared = SyncManager()
    
    private let serviceType = "latex-annot-p2p"
    private let myPeerId: MCPeerID
    private var session: MCSession
    private var advertiser: MCNearbyServiceAdvertiser?
    private var browser: MCNearbyServiceBrowser?
    
    @Published public var connectedPeers: [MCPeerID] = []
    @Published public var isSyncActive: Bool = false
    @Published public var lastReceivedAction: LiveCanvasAction?
    
    public override init() {
        #if os(iOS)
        self.myPeerId = MCPeerID(displayName: "iPad-\(UIDevice.current.name)")
        #else
        self.myPeerId = MCPeerID(displayName: "MacBook-\(Host.current().localizedName ?? "Mac")")
        #endif
        
        self.session = MCSession(peer: myPeerId, securityIdentity: nil, encryptionPreference: .optional)
        super.init()
        self.session.delegate = self
    }
    
    /// Démarre la découverte automatique entre le Mac et l'iPad
    public func startSync() {
        advertiser = MCNearbyServiceAdvertiser(peer: myPeerId, discoveryInfo: nil, serviceType: serviceType)
        advertiser?.delegate = self
        advertiser?.startAdvertisingPeer()
        
        browser = MCNearbyServiceBrowser(peer: myPeerId, serviceType: serviceType)
        browser?.delegate = self
        browser?.startBrowsingForPeers()
        
        isSyncActive = true
    }
    
    public func stopSync() {
        advertiser?.stopAdvertisingPeer()
        browser?.stopBrowsingForPeers()
        session.disconnect()
        isSyncActive = false
        connectedPeers.removeAll()
    }
    
    /// Envoie un trait de dessin ou une annotation en direct à l'autre appareil
    public func broadcast(action: LiveCanvasAction) {
        guard !session.connectedPeers.isEmpty else { return }
        do {
            let data = try JSONEncoder().encode(action)
            try session.send(data, toPeers: session.connectedPeers, with: .reliable)
        } catch {
            print("Erreur envoi broadcast P2P : \(error)")
        }
    }
}

extension SyncManager: MCSessionDelegate {
    public func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        DispatchQueue.main.async {
            self.connectedPeers = session.connectedPeers
        }
    }
    
    public func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        if let action = try? JSONDecoder().decode(LiveCanvasAction.self, from: data) {
            DispatchQueue.main.async {
                self.lastReceivedAction = action
            }
        }
    }
    
    public func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    public func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    public func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

extension SyncManager: MCNearbyServiceAdvertiserDelegate {
    public func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        // Accepte automatiquement la connexion de son propre Mac ou iPad
        invitationHandler(true, self.session)
    }
}

extension SyncManager: MCNearbyServiceBrowserDelegate {
    public func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String : String]?) {
        // Invite automatiquement le Mac ou l'iPad trouvé à rejoindre la session de dessin
        browser.invitePeer(peerID, to: session, withContext: nil, timeout: 10)
    }
    
    public func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {}
}
