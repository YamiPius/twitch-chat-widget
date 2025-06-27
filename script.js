const tmiClient = new tmi.Client({
  channels: ['DEIN_KANALNAME'] // Anpassen!
});
tmiClient.connect();

tmiClient.on('message', function(channel, tags, message, self) {
  if (self) return;
  addChat({
    user: tags['display-name'] || tags.username,
    badgesRaw: tags.badges || '',
    text: parseEmotes(message, tags.emotes)
  });
});

tmiClient.on('subscription', function(channel, user, method, msg, tags) {
  addChat({
    user: user,
    badgesRaw: tags.badges || '',
    text: msg || 'hat abonniert!'
  });
});

tmiClient.on('resub', function(channel, user, months, msg, tags) {
  addChat({
    user: user,
    badgesRaw: tags.badges || '',
    text: 'resubbed (' + months + ' Monate)!'
  });
});

window.addEventListener('onEventReceived', function(obj) {
  if (obj.detail.type === 'tip') {
    var tip = obj.detail.event;
    addChat({
      user: tip.name,
      badgesRaw: '',
      text: 'hat ' + tip.amount + ' gespendet!'
    });
  }
});

function parseEmotes(text, emotes) {
  var result = escapeHtml(text);
  if (emotes) {
    Object.entries(emotes).forEach(function([id, ranges]) {
      ranges.forEach(function(range) {
        var [start, end] = range.split('-').map(Number);
        var code = text.substring(start, end + 1);
        var url = 'https://static-cdn.jtvnw.net/emoticons/v1/' + id + '/3.0';
        result = result.split(code).join(
          '<img class="chat-emote" src="' + url + '" alt="' + code + '">'
        );
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
  if (!badgesRaw || typeof badgesRaw !== 'string') return [];
  return badgesRaw.split(',').map(function(b) {
    var parts = b.split('/');
    return 'https://static-cdn.jtvnw.net/badges/v1/' + parts[0] + '/' + parts[1] + '/1';
  });
}

function addChat(data) {
  var user = data.user, text = data.text;
  var C = document.getElementById('chat');
  var wrap = document.createElement('div');
  wrap.className = 'chat-wrapper';

  var hdr = document.createElement('div');
  hdr.className = 'chat-header';
  getBadgeUrls(data.badgesRaw).forEach(function(src) {
    var img = document.createElement('img'); img.src = src;
    hdr.appendChild(img);
  });
  hdr.appendChild(document.createTextNode(user));
  wrap.appendChild(hdr);

  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  var msg = document.createElement('div');
  msg.className = 'chat-text';
  msg.innerHTML = text;
  bubble.appendChild(msg);

  var icon = document.createElement('div');
  icon.className = 'chat-icon';
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 539 539">
      <path d="M381 115.23L89.07 327.29h360.85L157.99 115.23l111.5 343.12z"
            fill="none" stroke="#C61215" stroke-width="25"/>
      <circle cx="269.5" cy="269.5" r="237.5"
              fill="none" stroke="#C61215" stroke-width="32"/>
    </svg>`;
  bubble.appendChild(icon);

  wrap.appendChild(bubble);
  C.appendChild(wrap);

  // Mehrzeilige Anzeige & Größe
  msg.style.opacity = 1;
  bubble.style.width = Math.min(bubble.scrollWidth, 460) + 'px';
}
