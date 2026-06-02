import { useRef, useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'

/* ------------------------------------------------------------------ */
/*  Home — Documentary Video Player                                   */
/*  Single-purpose page: play a video with custom controls, then      */
/*  fade to a closing credits screen.                                  */
/* ------------------------------------------------------------------ */

export default function Home() {
  /* ---- Refs ---- */
  const pageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const endScreenRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ---- State ---- */
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [showEndScreen, setShowEndScreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* ---- Helpers ---- */
  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00'
    const mins = Math.floor(t / 60)
    const secs = Math.floor(t % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const updateProgressCSS = (value: number) => {
    const pct = duration > 0 ? (value / duration) * 100 : 0
    document.documentElement.style.setProperty('--progress', `${pct}%`)
  }

  /* ---- Play / Pause ---- */
  const togglePlay = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play()
    } else {
      vid.pause()
    }
  }, [])

  /* ---- Video event handlers ---- */
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(vid.currentTime)
      setProgress(vid.currentTime)
      updateProgressCSS(vid.currentTime)
    }
    const onLoadedMetadata = () => {
      setDuration(vid.duration)
      updateProgressCSS(0)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setShowEndScreen(true)
      // Fade video out, fade end screen in
      gsap.to(videoContainerRef.current, { opacity: 0.3, duration: 1, ease: 'power2.out' })
      gsap.to(endScreenRef.current, { opacity: 1, duration: 1, ease: 'power2.out', onComplete: () => {
        if (endScreenRef.current) endScreenRef.current.style.pointerEvents = 'auto'
      }})
    }
    const onVolumeChange = () => {
      setVolume(vid.volume)
      setIsMuted(vid.muted)
    }
    const onRateChange = () => setPlaybackRate(vid.playbackRate)

    vid.addEventListener('play', onPlay)
    vid.addEventListener('pause', onPause)
    vid.addEventListener('timeupdate', onTimeUpdate)
    vid.addEventListener('loadedmetadata', onLoadedMetadata)
    vid.addEventListener('ended', onEnded)
    vid.addEventListener('volumechange', onVolumeChange)
    vid.addEventListener('ratechange', onRateChange)

    return () => {
      vid.removeEventListener('play', onPlay)
      vid.removeEventListener('pause', onPause)
      vid.removeEventListener('timeupdate', onTimeUpdate)
      vid.removeEventListener('loadedmetadata', onLoadedMetadata)
      vid.removeEventListener('ended', onEnded)
      vid.removeEventListener('volumechange', onVolumeChange)
      vid.removeEventListener('ratechange', onRateChange)
    }
  }, [])

  /* ---- Entrance animation ---- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 })

      tl.to(pageRef.current, { opacity: 1, duration: 0.8, ease: 'power2.out' })
        .fromTo(titleRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          0.3)
        .fromTo(videoContainerRef.current,
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' },
          0.5)
        .fromTo(subtitleRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' },
          0.7)
    })

    return () => ctx.revert()
  }, [])

  /* ---- Control bar auto-hide ---- */
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current)
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 2500)
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current)
    }
  }, [])

  /* ---- Keyboard controls ---- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showEndScreen) {
        if (e.key === ' ' || e.key === 'Enter') handleReplay()
        return
      }
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (videoRef.current) videoRef.current.currentTime += 5
          break
        case 'ArrowLeft':
          if (videoRef.current) videoRef.current.currentTime -= 5
          break
        case 'ArrowUp':
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1)
            videoRef.current.volume = newVol
          }
          break
        case 'ArrowDown':
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1)
            videoRef.current.volume = newVol
          }
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, showEndScreen])

  /* ---- Fullscreen ---- */
  const toggleFullscreen = useCallback(async () => {
    const container = videoContainerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Fallback: use video element native fullscreen
      const vid = videoRef.current
      if (!vid) return
      if (!document.fullscreenElement) {
        await vid.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  /* ---- Mute toggle ---- */
  const toggleMute = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = !vid.muted
  }, [])

  /* ---- Progress seek ---- */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const val = parseFloat(e.target.value)
    vid.currentTime = val
    setProgress(val)
    updateProgressCSS(val)
  }

  /* ---- Volume change ---- */
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const val = parseFloat(e.target.value)
    vid.volume = val
    vid.muted = val === 0
    setVolume(val)
  }

  /* ---- Playback rate ---- */
  const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const rate = parseFloat(e.target.value)
    vid.playbackRate = rate
    setPlaybackRate(rate)
  }

  /* ---- Replay ---- */
  const handleReplay = () => {
    const vid = videoRef.current
    if (!vid) return

    // Fade end screen out
    gsap.to(endScreenRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        setShowEndScreen(false)
        if (endScreenRef.current) endScreenRef.current.style.pointerEvents = 'none'
      }
    })

    // Fade video back in and restart
    gsap.to(videoContainerRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        vid.currentTime = 0
        updateProgressCSS(0)
        setProgress(0)
        setCurrentTime(0)
        vid.play()
      }
    })
  }

  /* ---- Big play button overlay (shown when paused and not ended) ---- */
  const showBigPlay = !isPlaying && !showEndScreen

  return (
    <div
      ref={pageRef}
      className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* ---- Film grain overlay ---- */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ---- Main content ---- */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 max-w-[1000px]">
        {/* Title */}
        <h1
          ref={titleRef}
          className="text-center text-[#EDEDED] font-['Playfair_Display'] text-xl sm:text-2xl lg:text-[28px] leading-[1.3] max-w-[700px] tracking-[0.02em]"
          style={{ opacity: 0 }}
        >
          Final of the Spanish Civil War and the Beginning of Francoism
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-center text-[#737373] font-['Inter'] text-xs sm:text-sm mt-2 uppercase tracking-[0.08em]"
          style={{ opacity: 0 }}
        >
          History Project – Group 2
        </p>

        {/* Video container */}
        <div
          ref={videoContainerRef}
          className="relative w-full mt-5 bg-[#141414] rounded overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] group"
          style={{ opacity: 0, aspectRatio: '16/9' }}
          onMouseMove={resetHideTimer}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            playsInline
            preload="metadata"
          >
            {/* Replace src with your video file */}
            <source src="/video/documentary.mp4" type="video/mp4" />
            <p className="text-[#737373] text-center p-8">
              Your browser does not support HTML5 video.
            </p>
          </video>

          {/* Big play button overlay (centered) */}
          {showBigPlay && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent hover:bg-black/10 transition-colors duration-300"
              aria-label="Play video"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C4956A]/20 border-2 border-[#C4956A]/60 flex items-center justify-center backdrop-blur-sm hover:bg-[#C4956A]/30 hover:border-[#C4956A]/80 hover:scale-110 transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#C4956A" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="8,5 8,19 20,12" />
                </svg>
              </div>
            </button>
          )}

          {/* Custom control bar */}
          <div
            ref={controlsRef}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-10 pb-3 px-3 sm:px-4 transition-opacity duration-300"
            style={{ opacity: showControls || !isPlaying ? 1 : 0, pointerEvents: showControls || !isPlaying ? 'auto' : 'none' }}
          >
            {/* Progress bar */}
            <div className="mb-2">
              <input
                type="range"
                className="progress-bar w-full"
                min={0}
                max={duration || 100}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                aria-label="Video progress"
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              {/* Left: Play, Time, Volume */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="text-[#EDEDED] hover:text-[#C4956A] transition-colors duration-200 p-1"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  )}
                </button>

                {/* Time display */}
                <span className="text-[#737373] font-['Inter'] text-[11px] sm:text-xs tracking-[0.05em] tabular-nums min-w-[85px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="text-[#EDEDED] hover:text-[#C4956A] transition-colors duration-200 p-1"
                    aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    className="volume-slider"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                  />
                </div>
              </div>

              {/* Right: Speed, Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Playback speed */}
                <select
                  value={playbackRate}
                  onChange={handleRateChange}
                  className="bg-transparent text-[#737373] hover:text-[#EDEDED] font-['Inter'] text-[11px] sm:text-xs tracking-[0.05em] border border-[#2a2a2a] rounded px-1.5 py-0.5 cursor-pointer hover:border-[#C4956A]/50 transition-colors duration-200 focus:outline-none focus:border-[#C4956A]"
                  aria-label="Playback speed"
                >
                  <option value={0.5} className="bg-[#141414]">0.5x</option>
                  <option value={1} className="bg-[#141414]">1x</option>
                  <option value={1.25} className="bg-[#141414]">1.25x</option>
                  <option value={1.5} className="bg-[#141414]">1.5x</option>
                  <option value={2} className="bg-[#141414]">2x</option>
                </select>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-[#EDEDED] hover:text-[#C4956A] transition-colors duration-200 p-1"
                  aria-label="Fullscreen"
                >
                  {isFullscreen ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 3h6v6" />
                      <path d="M9 21H3v-6" />
                      <path d="M21 3l-7 7" />
                      <path d="M3 21l7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- End credits overlay ---- */}
      <div
        ref={endScreenRef}
        className="end-screen-bg fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]"
        style={{ opacity: 0, pointerEvents: 'none' }}
      >
        <h2
          className="text-[#EDEDED] font-['Playfair_Display'] text-xl sm:text-2xl lg:text-[32px] text-center tracking-[0.02em] px-6"
        >
          Thank you for watching this historical project.
        </h2>
        <p
          className="text-[#737373] font-['Inter'] text-sm sm:text-base mt-4 tracking-[0.1em]"
        >
          Sami Agharbi • Samuel Poza • Cristian Durán
        </p>
        <button
          onClick={handleReplay}
          className="mt-8 px-6 py-2.5 border border-[#C4956A] text-[#C4956A] font-['Inter'] text-xs uppercase tracking-[0.05em] rounded-sm hover:bg-[#C4956A] hover:text-[#0A0A0A] transition-all duration-300"
        >
          Replay Video
        </button>
      </div>
    </div>
  )
}
