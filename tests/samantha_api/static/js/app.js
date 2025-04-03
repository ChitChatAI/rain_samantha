document.addEventListener('DOMContentLoaded', () => {
  // Existing element references
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const translateToggle = document.getElementById('translate-toggle');
  const translateContainer = document.getElementById('translate-container');
  const originalResponseInput = document.getElementById('original-response');
  const suggestionPills = document.querySelectorAll('.suggestion-pill');
  
  // New history sidebar elements
  const historySidebar = document.getElementById('history-sidebar');
  const historyToggle = document.getElementById('history-toggle');
  const closeHistory = document.getElementById('close-history');
  const historyList = document.getElementById('history-list');
  const clearHistory = document.getElementById('clear-history');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  // Mobile menu elements
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileDropdown = document.getElementById('mobile-dropdown');
  const mobileTranslateToggle = document.getElementById('mobile-translate-toggle');
  const historyOption = document.querySelector('.history-option');
  
  // Page loading spinner
  const pageLoading = document.getElementById('page-loading');
  
  // History storage
  let conversations = loadConversations();
  let currentConversationId = generateId();
  let currentConversation = {
    id: currentConversationId,
    title: 'New Conversation',
    messages: [],
    timestamp: new Date().toISOString()
  };
  
  // Track if we are in translate mode
  let isTranslateMode = false;
  
  // Initialize the history sidebar
  renderConversationHistory();
  
  // Toggle history sidebar with animation for the button
  historyToggle.addEventListener('click', () => {
    historySidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    historyToggle.classList.toggle('active'); // Add active class to toggle button
  });
  
  closeHistory.addEventListener('click', () => {
    historySidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
  
  sidebarOverlay.addEventListener('click', () => {
    historySidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
  
  // Clear all history
  clearHistory.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all conversation history?')) {
      conversations = [];
      saveConversations(conversations);
      renderConversationHistory();
    }
  });
  
  // Auto-resize textarea as user types
  messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  
  // Toggle translate mode
  translateToggle.addEventListener('change', () => {
    isTranslateMode = translateToggle.checked;
    translateContainer.classList.toggle('active', isTranslateMode);
    
    // Add dramatic active class to the toggle container
    const toggleContainer = document.querySelector('.float-toggle');
    toggleContainer.classList.add('active');
    
    // Remove the active class after animation completes
    setTimeout(() => {
      toggleContainer.classList.remove('active');
    }, 1000);
    
    // Adjust chat container height when translate section is shown/hidden
    adjustMessagesContainerHeight();
  });
  
  // Add event listeners to suggestion pills
  suggestionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      messageInput.value = pill.textContent;
      messageInput.focus();
      // Trigger input event to resize textarea
      messageInput.dispatchEvent(new Event('input'));
    });
  });
  
  // Handle sideways scrolling for suggestions with mouse wheel
  const suggestionsScroll = document.querySelector('.suggestions-scroll');
  suggestionsScroll.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      suggestionsScroll.scrollLeft += e.deltaY;
    }
  });
  
  function adjustMessagesContainerHeight() {
    // Allow messages container to adjust after translate container is toggled
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }
  
  // Handle sending messages
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Focus input field on page load
  messageInput.focus();
  
  // Handle window resize for responsiveness
  window.addEventListener('resize', () => {
    adjustMessagesContainerHeight();
  });
  
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Clear input and reset height
    messageInput.value = '';
    messageInput.style.height = '';
    messageInput.focus();
    
    // Add user message to chat and to conversation history
    addMessage(message, true);
    saveMessageToHistory(message, 'user');
    
    // Update the conversation title if it's the first message
    if (currentConversation.messages.length === 1) {
      currentConversation.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      saveConversations(conversations);
      renderConversationHistory();
    }
    
    // Show simple dots spinner instead of fancy spinner
    const spinnerContainer = document.createElement('div');
    spinnerContainer.classList.add('dots-container');
    spinnerContainer.innerHTML = `
      <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
    messagesContainer.appendChild(spinnerContainer);
    scrollToBottom();
    
    // Disable send button during API call
    sendButton.disabled = true;
    
    try {
      const payload = {
        messages: [{
          role: 'user',
          content: message
        }],
        translate_mode: isTranslateMode
      };
      
      if (isTranslateMode) {
        const originalResponse = originalResponseInput.value.trim();
        if (!originalResponse) {
          throw new Error('Please provide an original response to translate');
        }
        payload.original_response = originalResponse;
      }
      
      console.log('Sending payload:', payload);
      
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.detail || 'Failed to get response');
      }
      
      console.log('Received response:', data);
      
      // Remove spinner with slight delay for smoother transition
      setTimeout(() => {
        messagesContainer.removeChild(spinnerContainer);
        
        // Add bot response to chat and history
        addMessage(data.response, false);
        saveMessageToHistory(data.response, 'assistant');
        
        // Clear translate input after successful translation
        if (isTranslateMode) {
          originalResponseInput.value = '';
        }
      }, 300);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Remove spinner
      if (spinnerContainer.parentNode) {
        messagesContainer.removeChild(spinnerContainer);
      }
      
      // Show error message
      addMessage(`Error: ${error.message}`, false);
      saveMessageToHistory(`Error: ${error.message}`, 'system');
    } finally {
      // Re-enable send button
      sendButton.disabled = false;
      scrollToBottom();
    }
  }
  
  // Update the suggestions container structure with categories
  function initializeSuggestions() {
    const suggestionsScroll = document.querySelector('.suggestions-scroll');
    
    // Clear existing suggestions
    suggestionsScroll.innerHTML = '';
    
    // Define categorized suggestions
    const suggestionCategories = [
      {
        name: 'Conversation Starters',
        suggestions: [
          "It feels like we've known each other for years!",
          "Can we have a relaxed chat?",
          "I'm in a weird mood - can we talk?"
        ]
      },
      {
        name: 'Customer Support',
        suggestions: [
          "Samantha, convince me to stay with rain.",
          "How would you handle a difficult customer?",
          "What's your stance on white lies in sales?"
        ]
      },
      {
        name: 'Tone & Style',
        suggestions: [
          "Help me humanize this chatbot reply?",
          "Take this cold message and make it warmer.",
          "Talk to me like you're in a rush.",
          "Tell me something about yourself.",
          "How have you been lately?",
          "Tell me how you make decisions?"
        ]
      }
    ];
    
    // Create categorized suggestions
    suggestionCategories.forEach(category => {
      // Add category header
      const categoryElement = document.createElement('div');
      categoryElement.className = 'suggestion-category';
      categoryElement.textContent = category.name;
      suggestionsScroll.appendChild(categoryElement);
      
      // Add suggestions for this category
      category.suggestions.forEach((text, index) => {
        const pill = document.createElement('button');
        pill.className = 'suggestion-pill';
        
        // All pills now have the same class and width, no special treatment
        pill.textContent = text;
        pill.style.animationDelay = `${0.05 * index}s`;
        
        pill.addEventListener('click', () => {
          messageInput.value = text;
          messageInput.focus();
          messageInput.dispatchEvent(new Event('input'));
        });
        
        suggestionsScroll.appendChild(pill);
      });
    });
  }
  
  // Call this function during initialization
  initializeSuggestions();
  
  // Add the missing scrollToBottom function
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Replace the original addMessage function with this improved version with profile pics
  function addMessage(text, isUser) {
    // Create message group container
    const messageGroup = document.createElement('div');
    messageGroup.classList.add('message-group');
    if (isUser) {
      messageGroup.classList.add('user-message-group');
    } else {
      messageGroup.classList.add('bot-message-group');
    }
    
    // Add profile picture
    const profilePic = document.createElement('div');
    profilePic.classList.add('profile-pic');
    
    if (isUser) {
      profilePic.innerHTML = '<div class="user-profile-pic-initial">U</div>';
    } else {
      profilePic.innerHTML = '<div class="bot-profile-pic-initial">S</div>';
    }
    
    messageGroup.appendChild(profilePic);
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');
    messageElement.textContent = text;
    
    // Create timestamp element
    const timestamp = document.createElement('div');
    timestamp.classList.add('message-timestamp');
    
    // Get formatted time
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestamp.textContent = timeString;
    
    // Add message and timestamp to group
    messageGroup.appendChild(messageElement);
    messageGroup.appendChild(timestamp);
    
    // Check if we need to add a date divider
    const lastDate = getLastMessageDate();
    const currentDate = formatDate(now);
    
    if (currentDate !== lastDate) {
      addDateDivider(currentDate, now);
    }
    
    // Add with slight delay for smoother animation when multiple messages are added
    setTimeout(() => {
      messagesContainer.appendChild(messageGroup);
      scrollToBottom();
    }, isUser ? 0 : 100);
  }
  
  // Helper function to get the date of the last message
  function getLastMessageDate() {
    const messageGroups = messagesContainer.querySelectorAll('.message-group');
    if (messageGroups.length === 0) return null;
    
    // Try to find the last date divider
    const dateDividers = messagesContainer.querySelectorAll('.date-divider');
    if (dateDividers.length > 0) {
      const lastDivider = dateDividers[dateDividers.length - 1];
      const dateText = lastDivider.querySelector('.date-divider-text');
      return dateText ? dateText.getAttribute('data-date') : null;
    }
    
    return null;
  }
  
  // Helper function to add a date divider
  function addDateDivider(dateString, dateObj) {
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    
    const isToday = isDateToday(dateObj);
    const isYesterday = isDateYesterday(dateObj);
    
    let displayText = dateString;
    if (isToday) {
      displayText = 'Today';
    } else if (isYesterday) {
      displayText = 'Yesterday';
    }
    
    divider.innerHTML = `<span class="date-divider-text" data-date="${dateString}">${displayText}</span>`;
    messagesContainer.appendChild(divider);
  }
  
  // Helper to format date as YYYY-MM-DD for comparisons
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  // Helper to check if date is today
  function isDateToday(date) {
    const today = new Date();
    return formatDate(today) === formatDate(date);
  }
  
  // Helper to check if date is yesterday
  function isDateYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday) === formatDate(date);
  }
  
  // Conversation history functions
  function saveMessageToHistory(content, role) {
    // Create message object with timestamp
    const messageObj = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    
    // Find if we have the current conversation in our history
    let existingConvo = conversations.find(c => c.id === currentConversationId);
    
    if (!existingConvo) {
      // If this is a new conversation, add it to our history
      currentConversation.messages.push(messageObj);
      conversations.unshift(currentConversation);
    } else {
      // Add to existing conversation
      existingConvo.messages.push(messageObj);
      existingConvo.timestamp = new Date().toISOString();
    }
    
    // Save to localStorage
    saveConversations(conversations);
    
    // Update the sidebar
    renderConversationHistory();
  }
  
  function loadConversations() {
    try {
      const saved = localStorage.getItem('samantha-conversations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load conversations:', e);
      return [];
    }
  }
  
  function saveConversations(conversations) {
    try {
      localStorage.setItem('samantha-conversations', JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  }
  
  function renderConversationHistory() {
    // Clear the current history list
    historyList.innerHTML = '';
    
    if (conversations.length === 0) {
      // Show empty state
      const emptyElement = document.createElement('div');
      emptyElement.className = 'history-empty';
      emptyElement.innerHTML = '<p>Your conversations will appear here.</p>';
      historyList.appendChild(emptyElement);
      return;
    }
    
    // Add each conversation to the list
    conversations.forEach((convo) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      if (convo.id === currentConversationId) {
        historyItem.classList.add('active');
      }
      
      // Get first user message for title, or use default
      const title = convo.title || 'Conversation';
      
      // Get last message for preview
      let preview = 'No messages';
      if (convo.messages.length > 0) {
        const lastMsg = convo.messages[convo.messages.length - 1];
        preview = lastMsg.content;
      }
      
      historyItem.innerHTML = `
        <div class="history-item-title">${title}</div>
        <div class="history-item-preview">${preview}</div>
      `;
      
      // Load conversation when clicked
      historyItem.addEventListener('click', () => {
        loadConversation(convo.id);
      });
      
      historyList.appendChild(historyItem);
    });
  }
  
  // Update loadConversation function to include profile pics
  function loadConversation(conversationId) {
    // Find the conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Update current conversation
    currentConversationId = conversationId;
    currentConversation = conversation;
    
    // Clear the messages container
    messagesContainer.innerHTML = '';
    
    // Track dates to add dividers appropriately
    let currentDateString = null;
    
    // Add all messages from the conversation
    conversation.messages.forEach(msg => {
      // Check if message has timestamp, if not use current timestamp
      const msgTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
      const msgDateString = formatDate(msgTime);
      
      // Add date divider if this is a new date
      if (msgDateString !== currentDateString) {
        addDateDivider(msgDateString, msgTime);
        currentDateString = msgDateString;
      }
      
      // Create message group
      const messageGroup = document.createElement('div');
      messageGroup.classList.add('message-group');
      const isUser = msg.role === 'user';
      if (isUser) {
        messageGroup.classList.add('user-message-group');
      } else {
        messageGroup.classList.add('bot-message-group');
      }
      
      // Add profile picture
      const profilePic = document.createElement('div');
      profilePic.classList.add('profile-pic');
      
      if (isUser) {
        profilePic.innerHTML = '<div class="user-profile-pic-initial">U</div>';
      } else {
        profilePic.innerHTML = '<div class="bot-profile-pic-initial">S</div>';
      }
      
      messageGroup.appendChild(profilePic);
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');
      messageElement.textContent = msg.content;
      
      // Create timestamp element
      const timestamp = document.createElement('div');
      timestamp.classList.add('message-timestamp');
      timestamp.textContent = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add message and timestamp to group
      messageGroup.appendChild(messageElement);
      messageGroup.appendChild(timestamp);
      
      // Add to container
      messagesContainer.appendChild(messageGroup);
    });
    
    // Update active state in history list
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
      item.classList.remove('active');
      if (item.querySelector('.history-item-title').textContent === conversation.title) {
        item.classList.add('active');
      }
    });
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      historySidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    }
  }
  
  function startNewConversation() {
    // Create a new conversation
    currentConversationId = generateId();
    currentConversation = {
      id: currentConversationId,
      title: 'New Conversation',
      messages: [],
      timestamp: new Date().toISOString()
    };
    
    // Clear the messages container
    messagesContainer.innerHTML = '';
    
    // Add the welcome message
    addMessage("Hi there! I'm Samantha from rain. How can I help you today?", false);
    
    // Update the sidebar
    renderConversationHistory();
  }
  
  function generateId() {
    return 'conv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Check API health on load
  async function checkApiHealth() {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      
      if (!data.api_key_configured) {
        addMessage('Warning: OpenAI API key is not configured. Please check the server settings.', false);
      }
    } catch (error) {
      addMessage('Error connecting to the server. Please make sure the backend is running.', false);
    }
  }
  
  // Initial animations and setup
  window.addEventListener('load', () => {
    // Ensure the viewport height is set correctly for mobile browsers
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    
    // Hide page loading spinner after a delay
    setTimeout(() => {
      pageLoading.classList.add('hidden');
      setTimeout(() => {
        pageLoading.style.display = 'none';
      }, 500);
    }, 1500);
    
    // Check API health after a delay to allow animations to complete
    setTimeout(checkApiHealth, 2000);
  });
  
  // Improved responsive handling
  window.addEventListener('resize', () => {
    // Adjust messages container height
    adjustMessagesContainerHeight();
    
    // Handle sidebar visibility on resize
    if (window.innerWidth > 768 && sidebarOverlay.classList.contains('active')) {
      // Keep sidebar open on larger screens if it was open
    } else if (window.innerWidth <= 768 && historySidebar.classList.contains('active')) {
      // Close sidebar when resizing to mobile if it was open
      historySidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      historyToggle.classList.remove('active');
    }
    
    // Update viewport height for mobile browsers
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  });
  
  // Update viewport height on resize
  window.addEventListener('resize', () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  });
  
  // Mobile menu toggle
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    mobileDropdown.classList.toggle('active');
    
    // Add body class to prevent scrolling when menu is open
    document.body.classList.toggle('menu-open');
  });
  
  // Sync the state between desktop and mobile translate toggles
  mobileTranslateToggle.addEventListener('change', () => {
    // Update the desktop toggle to match
    translateToggle.checked = mobileTranslateToggle.checked;
    translateToggle.dispatchEvent(new Event('change'));
    
    // Close mobile dropdown after selection
    setTimeout(() => {
      mobileMenuToggle.classList.remove('active');
      mobileDropdown.classList.remove('active');
      document.body.classList.remove('menu-open');
    }, 300);
  });
  
  translateToggle.addEventListener('change', () => {
    // Keep mobile toggle in sync
    mobileTranslateToggle.checked = translateToggle.checked;
  });
  
  // History option in mobile dropdown
  historyOption.addEventListener('click', () => {
    // Open history sidebar
    historySidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    
    // Close the mobile dropdown
    mobileMenuToggle.classList.remove('active');
    mobileDropdown.classList.remove('active');
    document.body.classList.remove('menu-open');
  });
  
  // Window click to close dropdown when clicking outside
  window.addEventListener('click', (e) => {
    if (mobileDropdown.classList.contains('active') && 
        !mobileDropdown.contains(e.target) && 
        !mobileMenuToggle.contains(e.target)) {
      mobileMenuToggle.classList.remove('active');
      mobileDropdown.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
  
  // Add this to your existing CSS
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      body.menu-open {
        overflow: hidden;
      }
    </style>
  `);
});
