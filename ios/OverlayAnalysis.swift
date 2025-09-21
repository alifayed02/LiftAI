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

  @objc(render:items:analysis:resolver:rejecter:)
  func render(_ input: String,
              items: NSArray,
              analysis: NSDictionary,
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
    
    // Parse analysis JSON and add caption layers
    addCaptions(
      from: analysis,
      to: overlayLayer,
      videoSize: videoSize,
      videoDuration: asset.duration)
    
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
  
  private func addCaptions(from analysis: NSDictionary, to layer: CALayer, videoSize: CGSize, videoDuration: CMTime) {
    guard let analysisArray = analysis["analysis"] as? NSArray else {
      print("No analysis array found in JSON")
      return
    }
    
    // Convert to array of tuples for easier processing
    var captionItems: [(startTime: CMTime, endTime: CMTime?, text: String)] = []
    
    for item in analysisArray {
      guard let analysisItem = item as? NSDictionary,
            let timestampStr = analysisItem["timestamp"] as? String,
            let suggestion = analysisItem["suggestion"] as? String else {
        continue
      }
      
      // Parse timestamp (format: "00:01" = MM:SS)
      let startTime = parseTimestamp(timestampStr)
      var endTime: CMTime? = nil
      
      // Check if there's an explicit endTimestamp
      if let endTimestampStr = analysisItem["endTimestamp"] as? String {
        endTime = parseTimestamp(endTimestampStr)
      }
      
      captionItems.append((startTime: startTime, endTime: endTime, text: suggestion))
    }
    
    // Sort by start time to ensure proper ordering
    captionItems.sort { $0.startTime < $1.startTime }
    
    // Calculate end times: each caption ends when the next one starts, or at video end
    for (index, item) in captionItems.enumerated() {
      let startTime = item.startTime
      let endTime: CMTime
      
      if let explicitEndTime = item.endTime {
        // Use explicit end time if provided
        endTime = explicitEndTime
      } else if index < captionItems.count - 1 {
        // End when next caption starts
        endTime = captionItems[index + 1].startTime
      } else {
        // Last caption: end at video end
        endTime = videoDuration
      }
      
      addCaptionLayer(
        text: item.text,
        startTime: startTime,
        endTime: endTime,
        to: layer,
        videoSize: videoSize
      )
    }
  }
  
  private func parseTimestamp(_ timestamp: String) -> CMTime {
    let components = timestamp.split(separator: ":")
    guard components.count == 2,
          let minutes = Int(components[0]),
          let seconds = Int(components[1]) else {
      return CMTime.zero
    }
    
    let totalSeconds = minutes * 60 + seconds
    return CMTime(seconds: Double(totalSeconds), preferredTimescale: 600)
  }
  
  private func addCaptionLayer(text: String, startTime: CMTime, endTime: CMTime, to layer: CALayer, videoSize: CGSize) {
    // Create caption background
    let backgroundLayer = CALayer()
    backgroundLayer.backgroundColor = UIColor.black.withAlphaComponent(0.8).cgColor
    backgroundLayer.cornerRadius = 8
    
    // Create text layer with white text and multiline support
    let paragraphStyle = NSMutableParagraphStyle()
    paragraphStyle.alignment = .left
    paragraphStyle.lineBreakMode = .byWordWrapping
    
    let attributedText = NSAttributedString(
      string: text,
      attributes: [
        .font: UIFont.systemFont(ofSize: 24, weight: .medium),
        .foregroundColor: UIColor.white,
        .paragraphStyle: paragraphStyle
      ])
    
    let textLayer = CATextLayer()
    textLayer.string = attributedText
    textLayer.shouldRasterize = true
    textLayer.rasterizationScale = UIScreen.main.scale
    textLayer.backgroundColor = UIColor.clear.cgColor
    textLayer.alignmentMode = .left
    textLayer.contentsScale = UIScreen.main.scale
    textLayer.isWrapped = true // Enable text wrapping
    
    // Calculate multiline text size with constrained width
    let padding: CGFloat = 20
    let maxWidth = videoSize.width - padding * 2
    let constrainedSize = CGSize(width: maxWidth, height: CGFloat.greatestFiniteMagnitude)
    
    let textRect = text.boundingRect(
      with: constrainedSize,
      options: [.usesLineFragmentOrigin, .usesFontLeading],
      attributes: [
        .font: UIFont.systemFont(ofSize: 24, weight: .medium),
        .paragraphStyle: paragraphStyle
      ],
      context: nil
    )
    
    let textSize = textRect.size
    
    // Position at bottom of video with padding
    let captionHeight = textSize.height + padding
    let captionWidth = maxWidth
    
    let captionY = videoSize.height - captionHeight - 60 // 60pt from bottom
    let captionX = (videoSize.width - captionWidth) / 2
    
    backgroundLayer.frame = CGRect(
      x: captionX,
      y: captionY,
      width: captionWidth,
      height: captionHeight
    )
    
    textLayer.frame = CGRect(
      x: padding / 2,
      y: padding / 2,
      width: captionWidth - padding,
      height: textSize.height
    )
    
    // Add text layer to background layer
    backgroundLayer.addSublayer(textLayer)
    
    // Add timing animations
    let showAnimation = CABasicAnimation(keyPath: "opacity")
    showAnimation.fromValue = 0.0
    showAnimation.toValue = 1.0
    showAnimation.duration = 0.3
    showAnimation.beginTime = AVCoreAnimationBeginTimeAtZero + CMTimeGetSeconds(startTime)
    showAnimation.fillMode = .forwards
    showAnimation.isRemovedOnCompletion = false
    
    let hideAnimation = CABasicAnimation(keyPath: "opacity")
    hideAnimation.fromValue = 1.0
    hideAnimation.toValue = 0.0
    hideAnimation.duration = 0.3
    hideAnimation.beginTime = AVCoreAnimationBeginTimeAtZero + CMTimeGetSeconds(endTime)
    hideAnimation.fillMode = .forwards
    hideAnimation.isRemovedOnCompletion = false
    
    // Initially hide the caption
    backgroundLayer.opacity = 0.0
    
    backgroundLayer.add(showAnimation, forKey: "show")
    backgroundLayer.add(hideAnimation, forKey: "hide")
    
    layer.addSublayer(backgroundLayer)
  }
}
