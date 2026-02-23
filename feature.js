document.addEventListener('alpine:init', ()=> {
  Alpine.data('search', ()=> ({
    query: '',
    TTL: 60000,
    results: [],
    loading: false,
    cache: new Map(),
    undoStack: [],
    redoStack: [],
    currentIndex: -1,
    isProgrammatic: false,
    debounceTimer: null,

    async fetchSuggestions(query) {
      const now = Date.now();

      if (this.cache.has(query)) {
        const cached = this.cache.get(query);
        if (now - cached.timestamp < this.TTL) {
          return cached.data;
        } else {
          this.cache.delete(query);
        }
      }

      this.loading = true;

      try {
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=5&origin=*`
        );
        const data = await res.json();
        const suggestions = data[1];

        this.cache.set(query, {
          data: suggestions,
          timestamp: now
        });

        return suggestions;
      } catch {
        return [];
      } finally {
        this.loading = false;
      }
    },

    fuzzyMatch(keyword, input) {
      keyword = keyword.toLowerCase();
      input = input.toLowerCase();

      let inputIndex = 0;
      for (let char of keyword) {
        if (char === input[inputIndex]) inputIndex++;
      }

      return inputIndex === input.length;
    },

    highlightMatch(text) {
      if (!this.query) return text;
      const regex = new RegExp(`(${this.query})`, "gi");
      return text.replace(regex, "<b>$1</b>");
    },

    debounce(func, delay) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(func, delay);
    },

    onInput() {
      if (this.isProgrammatic) return;

      this.undoStack.push(this.query);
      this.redoStack = [];

      this.debounce(async () => {
        if (!this.query.trim()) {
          this.results = [];
          return;
        }

        const suggestions = await this.fetchSuggestions(this.query);
        this.results = suggestions.filter(item =>
          this.fuzzyMatch(item, this.query)
        );
      }, 300);
    },

    select(item) {
      this.query = item;
      this.saveToHistory(item);
      this.results = [];
    },

    handleKeydown(e) {

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        if (this.undoStack.length > 1) {
          const current = this.undoStack.pop();
          this.redoStack.push(current);

          this.isProgrammatic = true;
          this.query = this.undoStack[this.undoStack.length - 1];
          this.isProgrammatic = false;

          this.onInput();
        }
        return;
      }

      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        if (this.redoStack.length) {
          const next = this.redoStack.pop();
          this.undoStack.push(next);

          this.isProgrammatic = true;
          this.query = next;
          this.isProgrammatic = false;

          this.onInput();
        }
        return;
      }

      if (!this.results.length) return;

      if (e.key === "ArrowDown") {
        this.currentIndex =
          (this.currentIndex + 1) % this.results.length;
      }

      if (e.key === "ArrowUp") {
        this.currentIndex =
          (this.currentIndex - 1 + this.results.length) % this.results.length;
      }

      if (e.key === "Enter" && this.currentIndex >= 0) {
        this.select(this.results[this.currentIndex]);
      }
    },

    saveToHistory(value) {
      let history = JSON.parse(localStorage.getItem("history")) || [];

      if (!history.includes(value)) {
        history.unshift(value);
      }

      history = history.slice(0, 5);

      localStorage.setItem("history", JSON.stringify(history));
    },

    showHistory() {
      if (!this.query) {
        this.results = JSON.parse(localStorage.getItem("history")) || [];
      }
    }

  }))
})




