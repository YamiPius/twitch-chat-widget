// Twitch Chat Verbindung mit lokalem tmi.js
const tmiClient = new tmi.Client({
  channels: ['lulith']  // <-- Deinen Twitch-Kanal einsetzen
});
tmiClient.connect();

// Chatnachrichten
tmiClient.on('message', function(channel, tags, message, self) {
  if (self) return;
  addChat({
    user: tags['display-name'] || tags.username,
    badges: tags.badges || {},
    text: parseEmotes(message, tags.emotes)
  });
});

// Subscriptions
tmiClient.on('subscription', function(ch, user, method, msg, tags) {
  var badgePlan = (tags['badge-info'] && tags['badge-info'].plan) || 'sub';
  addChat({
    user: user,
    badges: { sub: badgePlan },
    text: msg || 'hat abonniert!'
  });
});

// Resubscriptions
tmiClient.on('resub', function(ch, user, months, msg, tags) {
  var badgePlan = tags['badge-info'] && tags['badge-info'].plan;
  addChat({
    user: user,
    badges: { sub: badgePlan },
    text: 'resubbed (' + months + ' Monate)!'
  });
});

// Donations via StreamElements
window.addEventListener('onEventReceived', function(obj) {
  if (obj.detail.type === 'tip') {
    var tip = obj.detail.event;
    addChat({
      user: tip.name,
      badges: {},
      text: 'hat ' + tip.amount + ' gespendet!'
    });
  }
});

// Emote-Parser
function parseEmotes(text, emotes) {
  var result = escapeHtml(text);
  if (emotes) {
    for (var id in emotes) {
      emotes[id].forEach(function(range) {
        var parts = range.split('-');
        var start = parseInt(parts[0], 10);
        var end = parseInt(parts[1], 10);
        var code = text.substring(start, end + 1);
        var url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + id + '/3.0';
        result = result.replace(code, '<img class="chat-emote" src="' + url + '" alt="' + code + '">');
      });
    }
  }
  return result;
}

// HTML-Escaping
function escapeHtml(s) {
  return s.replace(/[&<>]/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
  });
}

// Chat anzeigen & animieren
function addChat(data) {
  var C = document.getElementById('chat');
  var wrap = document.createElement('div');
  wrap.className = 'chat-wrapper';

  var hdr = document.createElement('div');
  hdr.className = 'chat-header';
  for (var key in data.badges) {
    var b = data.badges[key];
    var img = document.createElement('img');
    img.src = b.indexOf('https') === 0 ? b : 'https://static-cdn.jtvnw.net/badges/v1/' + b + '/3';
    hdr.appendChild(img);
  }
  hdr.appendChild(document.createTextNode(data.user));

  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  var msg = document.createElement('div');
  msg.className = 'chat-text';
  msg.innerHTML = data.text;

  var icon = document.createElement('div');
  icon.className = 'chat-icon';
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 539 539">
      <path d="M381 115.23L89.07 327.29h360.85L157.99 115.23l111.5 343.12z"
            fill="none" stroke="#C61215" stroke-width="25"/>
      <circle cx="269.5" cy="269.5" r="237.5"
              fill="none" stroke="#C61215" stroke-width="32"/>
    </svg>`;

  wrap.appendChild(hdr);
  wrap.appendChild(bubble);
  bubble.appendChild(msg);
  bubble.appendChild(icon);
  C.appendChild(wrap);

  // Größe messen & Bubble anpassen
  var M = document.createElement('div');
  M.style.cssText = 'position:absolute;visibility:hidden;font:1rem "IM FELL Double Pica";white-space:nowrap';
  M.textContent = data.text;
  document.body.appendChild(M);

  var tw = Math.min(M.getBoundingClientRect().width, 460 - 66);
  document.body.removeChild(M);

  msg.style.maxWidth = tw + 'px';
  var finalW = 66 + 10 + tw + 3;

  requestAnimationFrame(function() {
    bubble.style.transition = 'width 1.2s ease-out';
    bubble.style.width = finalW + 'px';
    msg.style.transition = 'opacity 0.4s ease-out 0.4s';
    msg.style.opacity = 1;

    var start = performance.now();
    var dist = finalW - 66 - 3;
    (function step(now) {
      var p = Math.min((now - start) / 1200, 1);
      icon.style.transform = 'translateY(-50%) translateX(' + (p * dist) + 'px) rotate(' + (p * 360) + 'deg)';
      if (p < 1) requestAnimationFrame(step);
    })(start);
  });
}
