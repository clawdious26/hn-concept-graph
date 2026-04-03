'use client';

import { useMemo, useState } from 'react';
import graph from '../hn-topic-graph.json';

const palette = ['#7dd3fc', '#a78bfa', '#f472b6', '#f59e0b', '#34d399', '#fb7185', '#22d3ee', '#c084fc'];

function polar(index, total, radius, cx, cy) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

export default function Home() {
  const topics = graph.rankedTopics.slice(0, 8);
  const [activeKey, setActiveKey] = useState(topics[0]?.key ?? null);

  const { positions, edges, activeTopic, connectedKeys } = useMemo(() => {
    const maxScore = Math.max(...topics.map((t) => t.score));
    const nodes = topics.map((topic, i) => ({
      ...topic,
      color: palette[i % palette.length],
      ...polar(i, topics.length, 255, 390, 330),
      radius: 34 + (topic.score / maxScore) * 42,
    }));

    const filteredEdges = graph.topEdges
      .filter((edge) => topics.some((t) => t.label === edge.from) && topics.some((t) => t.label === edge.to))
      .slice(0, 16)
      .map((edge) => ({
        ...edge,
        fromNode: nodes.find((p) => p.label === edge.from),
        toNode: nodes.find((p) => p.label === edge.to),
      }));

    const current = nodes.find((n) => n.key === activeKey) ?? nodes[0];
    const linked = new Set([current?.key]);
    filteredEdges.forEach((edge) => {
      const fromKey = edge.fromNode?.key;
      const toKey = edge.toNode?.key;
      if (fromKey === current?.key && toKey) linked.add(toKey);
      if (toKey === current?.key && fromKey) linked.add(fromKey);
    });

    return { positions: nodes, edges: filteredEdges, activeTopic: current, connectedKeys: linked };
  }, [topics, activeKey]);

  return (
    <main className="page-shell">
      <div className="noise" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />

      <section className="hero">
        <div>
          <p className="eyebrow">LIVE HACKER NEWS SIGNAL MAP</p>
          <h1>What HN is orbiting right now.</h1>
          <p className="lede">
            A more cinematic concept map of the current front page and comments: hover, tap, and trace the strongest topic clusters instead of reading a brick of bullets.
          </p>
        </div>
        <div className="hero-stats glass floaty">
          <div>
            <span>Scraped</span>
            <strong>{new Date(graph.scrapedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</strong>
          </div>
          <div>
            <span>Topics visualized</span>
            <strong>{topics.length}</strong>
          </div>
          <div>
            <span>Current focus</span>
            <strong>{activeTopic?.label}</strong>
          </div>
        </div>
      </section>

      <section className="graph-panel glass">
        <div className="panel-head">
          <div>
            <p className="eyebrow">INTERACTIVE MAP</p>
            <h2>Topic gravity + overlap</h2>
          </div>
          <p className="panel-copy">Hover or tap a node to spotlight its neighborhood. Bigger nodes = more signal. Brighter links = stronger co-occurrence.</p>
        </div>

        <div className="graph-wrap">
          <div className="graph-stage">
            <svg viewBox="0 0 780 660" className="graph-svg" role="img" aria-label="Hacker News concept graph">
              <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </radialGradient>
              </defs>

              <circle cx="390" cy="330" r="84" fill="url(#coreGlow)" opacity="0.18" />

              {edges.map((edge, idx) => {
                const lit = edge.fromNode?.key === activeTopic?.key || edge.toNode?.key === activeTopic?.key;
                return (
                  <line
                    key={`${edge.from}-${edge.to}-${idx}`}
                    x1={edge.fromNode.x}
                    y1={edge.fromNode.y}
                    x2={edge.toNode.x}
                    y2={edge.toNode.y}
                    stroke={lit ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.10)'}
                    strokeWidth={(lit ? 2 : 1) + edge.weight * 0.34}
                    strokeLinecap="round"
                  />
                );
              })}

              {positions.map((node, i) => {
                const isActive = node.key === activeTopic?.key;
                const isConnected = connectedKeys.has(node.key);
                return (
                  <g
                    key={node.key}
                    onMouseEnter={() => setActiveKey(node.key)}
                    onClick={() => setActiveKey(node.key)}
                    className="nodeGroup"
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={node.x} cy={node.y} r={node.radius + 18} fill={node.color} opacity={isActive ? '0.26' : isConnected ? '0.16' : '0.08'} />
                    <circle cx={node.x} cy={node.y} r={node.radius} fill={node.color} opacity={isActive ? '1' : isConnected ? '0.92' : '0.45'} />
                    <circle cx={node.x} cy={node.y} r={node.radius - 10} fill="rgba(8,12,24,0.84)" />
                    <text x={node.x} y={node.y - 4} textAnchor="middle" className="nodeScore">#{i + 1}</text>
                    <text x={node.x} y={node.y + 16} textAnchor="middle" className="nodeTiny">{node.score}</text>
                  </g>
                );
              })}
            </svg>

            <div className="graph-callout glass">
              <p className="eyebrow">ACTIVE TOPIC</p>
              <h3>{activeTopic?.label}</h3>
              <p>
                <strong>{activeTopic?.mentionCount}</strong> direct mentions across <strong>{activeTopic?.storyMentions}</strong> front-page clusters.
              </p>
              <ul>
                {activeTopic?.stories?.slice(0, 4).map((story) => (
                  <li key={story}>{story}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="legend">
            {positions.map((node, i) => {
              const isActive = node.key === activeTopic?.key;
              return (
                <button
                  key={node.key}
                  className={`legend-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActiveKey(node.key)}
                  onClick={() => setActiveKey(node.key)}
                >
                  <div className="legend-chip" style={{ background: node.color }} />
                  <div>
                    <div className="legend-rank">#{i + 1} · {node.label}</div>
                    <div className="legend-meta">score {node.score} · mentions {node.mentionCount} · stories {node.storyMentions}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card-grid">
        {topics.map((topic, i) => {
          const isActive = topic.key === activeTopic?.key;
          return (
            <article
              key={topic.key}
              className={`topic-card glass ${isActive ? 'active' : ''}`}
              onMouseEnter={() => setActiveKey(topic.key)}
              onClick={() => setActiveKey(topic.key)}
            >
              <div className="topic-topline">
                <span className="rank">#{i + 1}</span>
                <span className="score">signal {topic.score}</span>
              </div>
              <h3>{topic.label}</h3>
              <p>
                <strong>{topic.mentionCount}</strong> direct mentions across <strong>{topic.storyMentions}</strong> front-page clusters.
              </p>
              <ul>
                {topic.stories.slice(0, 3).map((story) => (
                  <li key={story}>{story}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="edge-table glass">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">TOP CONNECTIONS</p>
            <h2>Where the graph is densest</h2>
          </div>
        </div>
        <div className="edge-list">
          {graph.topEdges.slice(0, 10).map((edge, i) => (
            <div className="edge-row" key={`${edge.from}-${edge.to}-${i}`}>
              <span>{edge.from}</span>
              <div className="edge-bar"><div style={{ width: `${Math.min(100, edge.weight * 10)}%` }} /></div>
              <span>{edge.to}</span>
              <strong>{edge.weight}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
