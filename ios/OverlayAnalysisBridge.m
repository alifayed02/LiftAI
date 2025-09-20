#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(OverlayAnalysis, NSObject)

RCT_EXTERN_METHOD(render:(NSString *)input
                  items:(NSArray *)items
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
