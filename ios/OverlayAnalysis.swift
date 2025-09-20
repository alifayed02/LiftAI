//
//  OverlayAnalysis.swift
//  Skeleton for AVFoundation-based overlay rendering.
//  Start here and fill in the TODOs.
//

import Foundation
import AVFoundation
import UIKit
import CoreMedia
import React

@objc(OverlayAnalysis)
class OverlayAnalysis: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc(render:items:resolver:rejecter:)
  func render(_ input: String,
              items: NSArray,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {

    // 0) Normalize input URL
    guard let inputURL = normalizeURL(from: input) else {
      reject("bad_input_url", "Could not parse input URL from: \(input)", nil)
      return
    }

    let asset = AVURLAsset(url: inputURL)
    let composition = AVMutableComposition()
    
    guard
      let compositionTrack = composition.addMutableTrack(
        withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
      let assetTrack = asset.tracks(withMediaType: .video).first
      else {
        print("Something is wrong with the asset.")
        reject("asset_error", "Something is wrong with the asset.", nil)
        return
    }
    
    do {
      let timeRange = CMTimeRange(start: .zero, duration: asset.duration)
      try compositionTrack.insertTimeRange(timeRange, of: assetTrack, at: .zero)
      
      if let audioAssetTrack = asset.tracks(withMediaType: .audio).first,
        let compositionAudioTrack = composition.addMutableTrack(
          withMediaType: .audio,
          preferredTrackID: kCMPersistentTrackID_Invalid) {
        try compositionAudioTrack.insertTimeRange(
          timeRange,
          of: audioAssetTrack,
          at: .zero)
      }
    } catch {
      print(error)
      reject("export_failed", "Something went wrong during export.", nil)
      return
    }
    
    compositionTrack.preferredTransform = assetTrack.preferredTransform
    let videoInfo = orientation(from: assetTrack.preferredTransform)

    let videoSize: CGSize
    if videoInfo.isPortrait {
      videoSize = CGSize(
        width: assetTrack.naturalSize.height,
        height: assetTrack.naturalSize.width)
    } else {
      videoSize = assetTrack.naturalSize
    }
    
    let videoLayer = CALayer()
    videoLayer.frame = CGRect(origin: .zero, size: videoSize)
    let overlayLayer = CALayer()
    overlayLayer.frame = CGRect(origin: .zero, size: videoSize)
    
    add(
      text: "Happy Birthday",
      to: overlayLayer,
      videoSize: videoSize)
    
    let outputLayer = CALayer()
    outputLayer.frame = CGRect(origin: .zero, size: videoSize)
    outputLayer.addSublayer(videoLayer)
    outputLayer.addSublayer(overlayLayer)
    
    let videoComposition = AVMutableVideoComposition()
    videoComposition.renderSize = videoSize
    videoComposition.frameDuration = CMTime(value: 1, timescale: 30)
    videoComposition.animationTool = AVVideoCompositionCoreAnimationTool(
      postProcessingAsVideoLayer: videoLayer,
      in: outputLayer)
    
    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = CMTimeRange(
      start: .zero,
      duration: composition.duration)
    videoComposition.instructions = [instruction]
    let layerInstruction = compositionLayerInstruction(
      for: compositionTrack,
      assetTrack: assetTrack)
    instruction.layerInstructions = [layerInstruction]
    
    guard let export = AVAssetExportSession(
      asset: composition,
      presetName: AVAssetExportPresetHighestQuality)
      else {
        print("Cannot create export session.")
        reject("export_failed", "Cannot create export session.", nil)
        return
    }
    
    let videoName = UUID().uuidString
    let exportURL = URL(fileURLWithPath: NSTemporaryDirectory())
      .appendingPathComponent(videoName)
      .appendingPathExtension("mp4")

    export.videoComposition = videoComposition
    export.outputFileType = .mp4
    export.outputURL = exportURL

    export.exportAsynchronously {
      DispatchQueue.main.async {
        switch export.status {
        case .completed:
          resolve(exportURL.path)
        default:
          print("Something went wrong during export.")
          print(export.error ?? "unknown error")
          reject("export_failed", "Something went wrong during export.", nil)
          break
        }
      }
    }

    // If you want to quickly test the bridge without doing any work, you could:
    // resolve(inputURL.path)
  }

  // MARK: - Helpers

  /// Convert incoming string into a usable URL.
  /// Accepts "file:///..." or a raw filesystem path. (Add http/https handling if you plan to download.)
  private func normalizeURL(from input: String) -> URL? {
    if input.hasPrefix("file://") {
      return URL(string: input)
    } else {
      return URL(fileURLWithPath: input)
    }
  }

  private func orientation(from transform: CGAffineTransform) -> (orientation: UIImage.Orientation, isPortrait: Bool) {
    var assetOrientation = UIImage.Orientation.up
    var isPortrait = false
    if transform.a == 0 && transform.b == 1.0 && transform.c == -1.0 && transform.d == 0 {
      assetOrientation = .right
      isPortrait = true
    } else if transform.a == 0 && transform.b == -1.0 && transform.c == 1.0 && transform.d == 0 {
      assetOrientation = .left
      isPortrait = true
    } else if transform.a == 1.0 && transform.b == 0 && transform.c == 0 && transform.d == 1.0 {
      assetOrientation = .up
    } else if transform.a == -1.0 && transform.b == 0 && transform.c == 0 && transform.d == -1.0 {
      assetOrientation = .down
    }
    
    return (assetOrientation, isPortrait)
  }
  
  private func compositionLayerInstruction(for track: AVCompositionTrack, assetTrack: AVAssetTrack) -> AVMutableVideoCompositionLayerInstruction {
    let instruction = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
    let transform = assetTrack.preferredTransform
    
    instruction.setTransform(transform, at: .zero)
    
    return instruction
  }
  
  private func add(text: String, to layer: CALayer, videoSize: CGSize) {
    let attributedText = NSAttributedString(
      string: text,
      attributes: [
        .font: UIFont(name: "ArialRoundedMTBold", size: 60) as Any,
        .foregroundColor: UIColor.systemGreen,
        .strokeColor: UIColor.white,
        .strokeWidth: -3])
    let textLayer = CATextLayer()
    textLayer.string = attributedText
    textLayer.shouldRasterize = true
    textLayer.rasterizationScale = UIScreen.main.scale
    textLayer.backgroundColor = UIColor.clear.cgColor
    textLayer.alignmentMode = .center
    textLayer.frame = CGRect(
      x: 0,
      y: videoSize.height * 0.66,
      width: videoSize.width,
      height: 150)
    textLayer.displayIfNeeded()
    layer.addSublayer(textLayer)

  }
}
