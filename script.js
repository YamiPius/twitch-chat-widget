const tmiClient = new tmi.Client({
  channels: ['Lulith']
});
tmiClient.connect();

tmiClient.on('message', function(channel, tags, message, self) {
  if (self) return;
  addChat({
    user: tags['display-name'] || tags.username,
    badges_raw: tags.badges_raw || tags.badges,
    text: parseEmotes(message, tags.emotes)
  });
});

tmiClient.on('subscription', function(ch, user, method, msg, tags) {
  var badgePlan = (tags['badge-info'] && tags['badge-info'].plan) || 'sub';
  addChat({
    user: user,
    badges_raw: tags.badges_raw || tags.badges,
    text: msg || 'hat abonniert!'
  });
});

tmiClient.on('resub', function(ch, user, months, msg, tags) {
  addChat({
    user: user,
    badges_raw: tags.badges_raw || tags.badges,
    text: 'resubbed (' + months + ' Monate)!'
  });
});

window.addEventListener('onEventReceived', function(obj) {
  if (obj.detail.type === 'tip') {
    var tip = obj.detail.event;
    addChat({
      user: tip.name,
      badges_raw: '',
      text: 'hat ' + tip.amount + ' gespendet!'
    });
  }
});

function parseEmotes(text, emotes) {
  var result = escapeHtml(text);
  if (emotes) {
    Object.entries(emotes).forEach(function([id, ranges]) {
      ranges.forEach(function(range) {
        var parts = range.split('-');
        var s = parseInt(parts[0], 10), e = parseInt(parts[1], 10);
        var code = text.substring(s, e + 1);
        var url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + id + '/3.0';
        result = result.split(code).join('<img class="chat-emote" src="' + url + '" alt="' + code + '">');
      });
    });
  }
  return result;
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];
  });
}

function getBadgeUrls(badgesRaw) {
  if (!badgesRaw) return [];
  return badgesRaw.split(',').map(function(b) {
    var parts = b.split('/');
    return 'https://static-cdn.jtvnw.net/badges/v1/' + parts[0] + '/' + parts[1] + '/1';
  });
}

function addChat(data) {
  var C = document.getElementById('chat');
  var wrap = document.createElement('div');
  wrap.className = 'chat-wrapper';

  var hdr = document.createElement('div');
  hdr.className = 'chat-header';
  getBadgeUrls(data.badges_raw).forEach(function(src) {
    var img = document.createElement('img');
    img.src = src;
    hdr.appendChild(img);
  });
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
      <path d="M381 115.23L89.07 327.29h360.85L157.99 115.23l111.5 343.12z" fill="none" stroke="#C61215" stroke-width="25"/>
      <circle cx="269.5" cy="269.5" r="237.5" fill="none" stroke="#C61215" stroke-width="32"/>
    </svg>`;

  wrap.appendChild(hdr);
  wrap.appendChild(bubble);
  bubble.appendChild(msg);
  bubble.appendChild(icon);
  C.appendChild(wrap);

  // Bubble-Größe berechnen
  var M = document.createElement('div');
  M.style.cssText = 'position:absolute;visibility:hidden;font:1rem "IM FELL Double Pica";white-space:nowrap';
  M.textContent = msg.textContent;
  document.body.appendChild(M);

  var tw = Math.min(M.getBoundingClientRect().width, 460 - 66);
  document.body.removeChild(M);

  msg.style.maxWidth = tw + 'px';
  msg.style.whiteSpace = 'normal';

  requestAnimationFrame(function() {
    msg.style.opacity = 1;
    bubble.style.width = (tw + 20 + 60) + 'px'; // Text+Bubbles+Icon

    // Keine direkte SVG-Rollanimation bei multiline
    icon.style.transition = 'transform 0.8s ease-out';
    icon.style.transform = 'translateY(0) translateX(0) rotate(0)';
  });
}
