import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  ListMusic, Maximize2, ChevronRight, X 
} from 'lucide-react';
import './App.css'; // 引入拆分出去的样式

const mock_logo = "art.jpg";

// 完整歌曲列表定义（01-40，按序号升序排列，无.mp3后缀）
const songTitles = [
  "01－A Private Conversation",
  "02－Breakfast or Lunch",
  "03－Please Send Me a Card",
  "04－An Exciting Trip",
  "05－No Wrong Numbers",
  "06－Percy Buttons",
  "07－Too Late",
  "08－The Best and the Worst",
  "09－A Cold Welcome",
  "10－Not for Jazz",
  "11－One Good Turn Deserves Another",
  "12－Goodbye and Good Luck",
  "13－The Greenwood Boys",
  "14－Do You Speak English",
  "15－Good News",
  "16－A Polite Request",
  "17－Always Young",
  "18－He Often does This",
  "19－Sold Out",
  "20－One Man in a Boat",
  "21－Mad or Not",
  "22－A Glass Envelope",
  "23－A New House",
  "24－It Could be Worse",
  // 以下为补充的25-40首内容
  "25－Do the English Speak English",
  "26－The Best Art Critics",
  "27－A Wet Night",
  "28－No Parking",
  "29－Taxi",
  "30－Football or Polo",
  "31－Success Story",
  "32－Shopping Made Easy",
  "33－Out of the Darkness",
  "34－Quick Work",
  "35－Stop Thief",
  "36－Across the Channel",
  "37－The Olympic Games",
  "38－Everything Except the Weather",
  "39－Am I All Right",
  "40－Food and Talk"
];

// 构建歌曲数据，不再包含 LRC 字符串，而是指向路径
const MOCK_SONGS = songTitles.map((title, index) => ({
  id: index,
  title: title,
  artist: "新概念英语",
  url: `./songs/${title}.mp3`,
  lrcUrl: `./songs/${title}.lrc`, // 显式指定歌词文件路径
  cover: mock_logo,
}));

// LRC 解析函数
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
  
  // 用于存放异步加载并解析后的歌词数组
  const [lyrics, setLyrics] = useState([]);

  const audioRef = useRef(null);
  const lyricsScrollRef = useRef(null);
  const currentSong = songs[currentIndex];

  // --- 核心逻辑：监听 currentIndex，异步加载歌词文件 ---
  useEffect(() => {
    const fetchLrc = async () => {
      try {
        const response = await fetch(currentSong.lrcUrl);
        if (!response.ok) throw new Error('歌词加载失败');
        const text = await response.text();
        setLyrics(parseLRC(text));
      } catch (err) {
        console.error(err);
        setLyrics([{ time: 0, text: "暂无歌词或歌词加载失败" }]);
      }
    };

    fetchLrc();
  }, [currentIndex, currentSong.lrcUrl]);

  // 计算当前应该高亮的歌词索引
  const activeLyricIndex = useMemo(() => {
    const index = lyrics.findIndex((l, i) => {
      const next = lyrics[i + 1];
      return currentTime >= l.time && (!next || currentTime < next.time);
    });
    return index !== -1 ? index : 0;
  }, [currentTime, lyrics]);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 歌词自动滚动
  useEffect(() => {
    if (lyricsScrollRef.current) {
      const activeElement = lyricsScrollRef.current.children[activeLyricIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  // 播放/暂停控制
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

  const togglePlaylist = () => setShowPlaylist(!showPlaylist);

  return (
    <div className="app-container">
      {/* 动态背景 */}
      <div className="bg-blur" style={{ backgroundImage: `url(${currentSong.cover})` }} />

      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => setCurrentIndex((prev) => (prev + 1) % songs.length)}
      />

      {isMobile && showPlaylist && <div className="playlist-overlay" onClick={togglePlaylist} />}

      {/* 侧边栏 */}
      <aside className={`sidebar ${showPlaylist ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <ListMusic size={20} color="#10b981" />
            <span>播放列表 ({songs.length})</span>
          </div>
          {isMobile && (
            <button onClick={togglePlaylist} className="close-btn"><X size={24} /></button>
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

      {/* 主界面 */}
      <main className="main-content">
        <header className="top-nav">
          <button onClick={togglePlaylist} className="icon-btn"><ListMusic size={24} /></button>
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

        {/* 底部控制栏 */}
        <footer className="player-controls">
          <div className="progress-area">
            <span className="time">{formatTime(currentTime)}</span>
            <input
              type="range" min="0" max={duration || 0} step="0.1"
              value={currentTime} onChange={handleSeek} className="progress-bar"
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
                    const v = e.target.value;
                    setVolume(v);
                    audioRef.current.volume = v;
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
            {!isMobile && <div className="extra-info">Hi-Res Audio</div>}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;