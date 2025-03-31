

// Store for managing state
Maya.Store.pubsub = {
    name: 'pubsub',
    data: {
      log: []
    },
    events: {
      logMessage: (key) => (text) => {
          const data = Maya.Store.pubsub.data[key] || {};
          const prevLog = data.log || [];
        
          const timestamp = new Date().toLocaleTimeString();
          const newLog = [`[${timestamp}] ${text}`, ...prevLog.slice(0, 49)];
        
          Maya.Store.SetData({ store: 'pubsub', key })({
            ...data,
            log: newLog
          });
        },
        // Initialize the list with default items
        initializeList: async ev => {
          const defaultItems = [
              { id: 1, name: "Project Alpha", description: "First project" },
              { id: 2, name: "Project Beta", description: "Second project" },
              { id: 3, name: "Project Gamma", description: "Third project" },
          ];
      
          const headers = ["id", "name", "description"];
      
          Maya.Store.SetData({ store: 'pubsub', key: ev.key })({
              list: defaultItems,
              headers
          });
          Maya.Store.pubsub.events.logMessage(ev.key)("📤 Published 'list-updated' (init)");
          await Maya.Store.Publish({ topic: 'list-updated' })({
              list: defaultItems,
              headers
          });
      
      },
      
        // Add a new item to the list 
        addItem: async (ev) => {
            const formData = Maya.Store.pubsub.data.self;
            const currentData = Maya.Store.pubsub.data[ev.key] || { list: [] };
            const currentList = [...(currentData.list)];
        
            // Create the new item to add
            const newItem = {
                id: currentList.length + 1, // Auto-increment ID
                name: formData.name,
                description: formData.description,
            };
        
            // Add the new item to the list
            currentList.push(newItem);
            // Update the store with the new list
            Maya.Store.SetData({ store: 'pubsub', key: ev.key })({ list: currentList ,headers: currentData.headers});
            Maya.Store.pubsub.events.logMessage(ev.key)(`📤 Published 'list-updated' (added ${newItem.name})`);
            // Update the store with the modified list and re-render the UI
            await Maya.Store.Publish({ topic: 'list-updated' })({ list: currentList,headers: currentData.headers });
        }
    },
  };
  
  
  class MayaPubSub extends MayaMFE{
    constructor() {
        super()
        this.setView('main')
        this.setStore(Maya.Store.pubsub)
    }
    getTitle = () => "MayaPubSub"
    isSecured = () => false
  
    //No state management should be done in Component definition
    onLoad = async ev => {
        await Maya.Store.pubsub.events.initializeList(ev); // Initialize the list on load
    };
  }
  
  window.customElements.define('albert-pubsub', MayaPubSub);
  
  
  
  //Another ChildMFE
  Maya.Store.childtwo = {
    name: 'childtwo',
    data: {},
    events: {
      }
  }
  class ChildTwo extends MayaMFE {
    constructor() {
        super()
        this.setParent('pubsub')
        this.setView('childtwo')
        this.setStore(Maya.Store.childtwo)
    }
    isSecured = () => false
    // No state management should be done in Component definition
    onLoad = async (ev) => {
      const key = ev.key;
      this._key = key;
      // ✅ Step 1: Subscribe to pubsub
      await Maya.Store.Subscribe({ topic: 'list-updated' })(this);
  
      // ✅ Step 2: Fallback — manually sync if parent already has data
      const currentList = Maya.Store.pubsub.data[key]?.list;
      if (currentList?.length > 0) {
        const latestItem = currentList[currentList.length - 1];
        Maya.Store.SetData({ store: 'childtwo', key })({
          listSize: currentList.length,
          latestItem,
          plural: currentList.length !== 1
        });
      }
    };
    onMessage = (options) => async (msg) => {
      console.log("called");
      const listSize = msg.list.length;
      const latestItem = msg.list[msg.list.length - 1];
      Maya.Store.SetData({ store: 'childtwo', key: options.key })({
          listSize,
          latestItem
      });
      Maya.Store.pubsub.events.logMessage(options.key)(`📥 ChildTwo received 'list-updated' (${listSize} items)`);
  }
  
    
  
  }
  
  window.customElements.define('albert-childtwo', ChildTwo);