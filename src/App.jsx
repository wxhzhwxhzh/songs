import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  ListMusic, 
  Maximize2,
  ChevronRight,
  X
} from 'lucide-react';

const mock_logo="art.jpg";

/**
 * 模拟数据
 */
let MOCK_SONGS = Array.from({ length: 5 }).map((_, i) => ({
  id: i + 15,
  title: `歌曲 ${i + 1}`,
  artist: `艺术家 ${i + 1}`,
  url: `./songs/24－It Could be Worse.mp3`,
  cover: `https://picsum.photos/seed/${i + 10}/400/400`,
  lrc: `[00:00.00] 正在加载歌曲 ${i + 1} 的歌词...
[00:02.00] 欢迎使用音乐播放器
[00:04.00] 歌词同步滚动演示中
[00:06.00] 所有的美好都会不期而遇
[00:10.00] 旋律在耳边回荡
[00:15.00] 沉浸在音乐的世界里
[00:20.00] 啦啦啦...
[00:40.00] 感谢收听`
}));


const songTitles = [
  "01－A Private Conversation",
  "24－It Could be Worse",
  "02－Breakfast or Lunch",
  "03－Please Send Me a Card",
  "04－An Exciting Trip",
  "05－No Wrong Numbers",
  "06 Percy Buttons 巴顿斯",
  "07 Too Late 为时太晚 ",
  "08 The Best and the Worst 最好的和最差的 ",
  "09 A Cold Welcome 冷遇 ",
  "10 Not for Jazz 不适于演奏爵士乐 ",
  "11 One Good Turn Deserves Another 礼尚往来 ",
  "12 Goodbye and Good Luck 再见，一路顺风 ",
  "13 The Greenwood Boys 绿林少年 ",
  "14 Do You Speak English 你会讲英语吗？ ",
  "15 Good News 佳音 ",
  "16 A Polite Request 彬彬有礼的要求 ",
  "17 Always Young 青春常驻 ",
  "18 He Often does This 他经常干这种事！ ",
  "19 Sold Out 票已售完 ",
  "20 One Man in a Boat 独坐孤舟 ",
];

const nce_song = songTitles.map((title, index) => ({
  id: index,
  title: title,
  artist: "艺术家 1",
  url: `./songs/${title}.mp3`,
  cover: mock_logo,
  lrc: `[00:00.00] 正在加载歌曲的歌词...`
}));

MOCK_SONGS = [...nce_song, ...MOCK_SONGS];

// 解析 LRC 格式歌词
const parseLRC = (lrcString) => {
  const lines = lrcString.split('\n');
  const result = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = timeReg.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = minutes * 60 + seconds + (ms > 99 ? ms / 1000 : ms / 100);
      const text = line.replace(timeReg, '').trim();
      if (text) result.push({ time, text });
    }
  });
  return result;
};



const App = () => {
  const [songs] = useState(MOCK_SONGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const audioRef = useRef(null);
  const lyricsScrollRef = useRef(null);

  const currentSong = songs[currentIndex];
  const lyrics = useMemo(() => parseLRC(currentSong.lrc), [currentSong]);

  const activeLyricIndex = useMemo(() => {
    const index = lyrics.findIndex((l, i) => {
      const next = lyrics[i + 1];
      return currentTime >= l.time && (!next || currentTime < next.time);
    });
    return index !== -1 ? index : 0;
  }, [currentTime, lyrics]);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (lyricsScrollRef.current) {
      const activeElement = lyricsScrollRef.current.children[activeLyricIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  return (
    <div className="app-container">
      {/* 动态背景虚化 */}
      <div 
        className="bg-blur"
        style={{ backgroundImage: `url(${currentSong.cover})` }}
      />

      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => setCurrentIndex((prev) => (prev + 1) % songs.length)}
      />

      {/* 移动端遮罩层 */}
      {isMobile && showPlaylist && (
        <div className="playlist-overlay" onClick={togglePlaylist} />
      )}

      {/* 左侧播放列表 */}
      <aside className={`sidebar ${showPlaylist ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <ListMusic size={20} color="#10b981" />
            <span>播放列表 ({songs.length})</span>
          </div>
          {isMobile && (
            <button onClick={togglePlaylist} className="close-btn">
              <X size={24} />
            </button>
          )}
        </div>
        <div className="song-list">
          {songs.map((song, index) => (
            <div
              key={song.id}
              onClick={() => { 
                setCurrentIndex(index); 
                setIsPlaying(true);
                if (isMobile) setShowPlaylist(false);
              }}
              className={`song-item ${currentIndex === index ? 'active' : ''}`}
            >
              <img src={song.cover} alt="" className="song-thumb" />
              <div className="song-info">
                <div className="song-name">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 主播放区 */}
      <main className="main-content">
        <header className="top-nav">
          <button onClick={togglePlaylist} className="icon-btn">
            <ListMusic size={24} />
          </button>
          <div className="playing-now">
            <h3>{currentSong.title}</h3>
            <p>{currentSong.artist}</p>
          </div>
          <button className="icon-btn"><Maximize2 size={20} /></button>
        </header>

        <div className="player-body">
          <div className="cover-section">
            <div className={`disc ${isPlaying ? 'rotating' : ''}`}>
              <img src={currentSong.cover} alt="Cover" />
            </div>
          </div>

          <div className="lyrics-section">
            <div ref={lyricsScrollRef} className="lyrics-container">
              {lyrics.map((line, index) => (
                <p
                  key={index}
                  className={`lyric-line ${activeLyricIndex === index ? 'active' : ''}`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* 控制栏 */}
        <footer className="player-controls">
          <div className="progress-area">
            <span className="time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <span className="time">{formatTime(duration)}</span>
          </div>

          <div className="buttons-area">
            {!isMobile && (
              <div className="volume-control">
                <Volume2 size={18} />
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={volume} 
                  onChange={(e) => {
                    setVolume(e.target.value);
                    audioRef.current.volume = e.target.value;
                  }}
                />
              </div>
            )}

            <div className="playback-btns">
              <button onClick={() => setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length)} className="nav-btn">
                <SkipBack fill="currentColor" />
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="play-btn">
                {isPlaying ? <Pause fill="black" /> : <Play fill="black" style={{marginLeft: '4px'}} />}
              </button>
              <button onClick={() => setCurrentIndex((prev) => (prev + 1) % songs.length)} className="nav-btn">
                <SkipForward fill="currentColor" />
              </button>
            </div>

            {!isMobile && (
              <div className="extra-info">
                Standard <ChevronRight size={14} />
              </div>
            )}
          </div>
        </footer>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --primary: #10b981;
          --bg-dark: #09090b;
          --sidebar-bg: rgba(24, 24, 27, 0.95);
          --text-main: #f4f4f5;
          --text-dim: #71717a;
        }

        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          background: var(--bg-dark);
          color: var(--text-main);
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
          position: relative;
        }

        .bg-blur {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(80px) brightness(0.3);
          opacity: 0.4;
          z-index: 0;
        }

        /* 播放列表遮罩 */
        .playlist-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 15;
          display: none;
        }

        /* Sidebar */
        .sidebar {
          width: 300px;
          background: var(--sidebar-bg);
          backdrop-filter: blur(12px);
          border-right: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          z-index: 20;
          transition: transform 0.3s ease;
        }

        .sidebar.closed { 
          transform: translateX(-100%);
        }

        .sidebar-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: bold;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .song-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .song-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .song-item:hover { 
          background: rgba(255,255,255,0.05); 
        }

        .song-item.active { 
          background: rgba(16, 185, 129, 0.1); 
          color: var(--primary); 
        }

        .song-thumb { 
          width: 40px; 
          height: 40px; 
          border-radius: 4px; 
          object-fit: cover;
          flex-shrink: 0;
        }

        .song-info { 
          overflow: hidden;
          flex: 1;
        }

        .song-name { 
          font-size: 14px; 
          font-weight: 500; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }

        .song-artist { 
          font-size: 12px; 
          color: var(--text-dim); 
        }

        /* Main */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
          min-width: 0;
        }

        .top-nav {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .playing-now {
          flex: 1;
          text-align: center;
          padding: 0 20px;
          min-width: 0;
        }

        .playing-now h3 { 
          margin: 0; 
          font-size: 18px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .playing-now p { 
          margin: 4px 0 0; 
          font-size: 14px; 
          color: var(--text-dim); 
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .player-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 20px;
          gap: 20px;
          overflow: hidden;
        }

        .cover-section {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .disc {
          width: 280px;
          height: 280px;
          border-radius: 50%;
          border: 10px solid rgba(255,255,255,0.05);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .disc img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }

        .rotating { 
          animation: spin 20s linear infinite; 
        }

        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }

        .lyrics-section {
          flex: 1;
          height: 100%;
          max-height: 400px;
          position: relative;
          mask-image: linear-gradient(transparent, black 20%, black 80%, transparent);
        }

        .lyrics-container {
          height: 100%;
          overflow-y: auto;
          padding-top: 200px;
          padding-bottom: 200px;
          scrollbar-width: none;
        }

        .lyrics-container::-webkit-scrollbar { 
          display: none; 
        }

        .lyric-line {
          font-size: 22px;
          font-weight: 600;
          color: var(--text-dim);
          margin-bottom: 30px;
          transition: all 0.4s;
          text-align: center;
          opacity: 0.3;
          padding: 0 20px;
        }

        .lyric-line.active {
          color: var(--primary);
          opacity: 1;
          transform: scale(1.1);
          text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }

        /* Controls */
        .player-controls {
          padding: 20px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
        }

        .progress-area {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .time { 
          font-size: 12px; 
          color: var(--text-dim); 
          min-width: 35px;
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          appearance: none;
          background: #333;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }

        .progress-bar::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
        }

        .progress-bar::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        .buttons-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .volume-control { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          min-width: 150px;
        }

        .volume-control input { 
          width: 80px; 
          height: 3px; 
          accent-color: #777; 
        }
        
        .playback-btns { 
          display: flex; 
          align-items: center; 
          gap: 20px;
        }

        .nav-btn { 
          background: none; 
          border: none; 
          color: #aaa; 
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-btn:hover { 
          color: white; 
        }

        .play-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .play-btn:hover { 
          transform: scale(1.05); 
        }

        .icon-btn { 
          background: none; 
          border: none; 
          color: white; 
          cursor: pointer; 
          padding: 8px; 
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-btn:hover { 
          background: rgba(255,255,255,0.1); 
        }

        .extra-info {
          min-width: 150px;
          text-align: right;
          font-size: 14px;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 80%;
            max-width: 320px;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .playlist-overlay {
            display: block;
          }

          .top-nav {
            padding: 15px;
          }

          .playing-now h3 {
            font-size: 16px;
          }

          .playing-now p {
            font-size: 12px;
          }

          .player-body {
            flex-direction: column;
            padding: 20px 15px;
            gap: 30px;
          }

          .cover-section {
            width: 100%;
          }

          .disc {
            width: min(280px, 80vw);
            height: min(280px, 80vw);
            border-width: 8px;
          }

          .lyrics-section {
            width: 100%;
            max-height: 300px;
          }

          .lyric-line {
            font-size: 18px;
            margin-bottom: 20px;
          }

          .player-controls {
            padding: 15px;
          }

          .progress-area {
            gap: 8px;
            margin-bottom: 15px;
          }

          .buttons-area {
            justify-content: center;
          }

          .playback-btns {
            gap: 30px;
          }

          .nav-btn {
            padding: 12px;
          }

          .play-btn {
            width: 64px;
            height: 64px;
          }
        }

        @media (max-width: 480px) {
          .disc {
            width: min(240px, 70vw);
            height: min(240px, 70vw);
            border-width: 6px;
          }

          .lyric-line {
            font-size: 16px;
          }

          .playing-now h3 {
            font-size: 14px;
          }

          .playing-now p {
            font-size: 11px;
          }

          .playback-btns {
            gap: 20px;
          }

          .play-btn {
            width: 56px;
            height: 56px;
          }
        }

        /* 横屏适配 */
        @media (max-width: 768px) and (orientation: landscape) {
          .player-body {
            flex-direction: row;
            padding: 10px 15px;
          }

          .disc {
            width: min(200px, 35vh);
            height: min(200px, 35vh);
          }

          .lyrics-section {
            max-height: 60vh;
          }

          .player-controls {
            padding: 10px 15px;
          }

          .progress-area {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;