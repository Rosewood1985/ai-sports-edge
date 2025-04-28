import Foundation

@objc(LocaleManager)
class LocaleManager: NSObject {
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  private var hasListeners = false
  
  // Will be called when this module's first listener is added.
  @objc func startObserving() {
    hasListeners = true
    
    // Register for locale change notifications
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(localeDidChange),
      name: NSLocale.currentLocaleDidChangeNotification,
      object: nil
    )
  }
  
  // Will be called when this module's last listener is removed.
  @objc func stopObserving() {
    hasListeners = false
    
    // Remove locale change notifications
    NotificationCenter.default.removeObserver(
      self,
      name: NSLocale.currentLocaleDidChangeNotification,
      object: nil
    )
  }
  
  // Handle locale change notifications
  @objc func localeDidChange(notification: NSNotification) {
    if hasListeners {
      // Get the current locale
      let locale = Locale.current.identifier
      
      // Send event to JavaScript
      sendEvent(withName: "localeChanged", body: ["locale": locale])
    }
  }
  
  // Get the current locale
  @objc func getCurrentLocale(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let locale = Locale.current.identifier
    resolve(locale)
  }
}