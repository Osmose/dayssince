class Incident {
  constructor(description, date=new Date()) {
    this.description = description;
    this.date = date;
  }

  daysSince() {
    return Math.floor(Math.abs(new Date() - this.date) / (1000 * 60 * 60 * 24));
  }
}

Vue.component('incident-list', {
  props: [
    'incidents',
    'onCreateNewIncident',
    'onResetIncident',
    'onDeleteIncident',
    'validateIncident',
    'onMoveIncident',
  ],

  data() {
    return {
      showNewForm: false,
    };
  },

  template: `
    <ul class="incident-list">
      <draggable :list="incidents.slice()" @update="handleMoveIncident">
        <incident-list-item
          v-for="incident in incidents"
          :key="incident.description"
          :incident="incident"
          :on-reset="onResetIncident"
          :on-delete="onDeleteIncident"
        />
      </draggable>
      <li v-if="!showNewForm" @click="handleClickAddNew" class="add-new">
        <div><span>+</span> Add New</div>
      </li>
      <incident-form
        v-else
        :on-submit="handleSubmitNew"
        :on-cancel="handleCancelNew"
        :validate-incident="validateIncident"
      />
    </ul>
  `,

  methods: {
    handleClickAddNew(event) {
      this.showNewForm = true;
    },

    handleCancelNew() {
      this.showNewForm = false;
    },

    handleSubmitNew(incident) {
      this.onCreateNewIncident(incident);
      this.showNewForm = false;
    },

    handleMoveIncident(event) {
      this.onMoveIncident(event.oldIndex, event.newIndex);
    },
  },
});

Vue.component('incident-form', {
  props: ['incident', 'onSubmit', 'validateIncident', 'onCancel'],

  data() {
    let data = {
      days: 0,
      description: '',
      error: '',
    };

    if (this.incident) {
      data.days = incident.daysSince();
      data.description = incident.description;
    }

    return data;
  },

  template: `
    <li>
      <form @submit="handleSubmit">
        <div class="minor">It has been</div>
        <div class="days"><input type="text" class="field" v-model.number="days" size="2"> days</div>
        <div class="minor">since</div>
        <div class="description">
          <div
            class="field"
            ref="description"
            @keydown.13="handleSubmit"
            contenteditable
          ></div>
        </div>
        <div v-if="error" class="error">{{ this.error }}</div>
        <button type="submit">Save</button>
        <button type="button" @click="onCancel">Cancel</button>
      </form>
    </li>
  `,

  methods: {
    handleSubmit(event) {
      event.preventDefault();
      const incidentDate = new Date();
      incidentDate.setDate(incidentDate.getDate() - this.days);
      const incident = new Incident(this.$refs.description.textContent, incidentDate);

      this.error = this.validateIncident(incident);
      if (!this.error) {
        this.onSubmit(incident);
      }
    }
  }
});

Vue.component('incident-list-item', {
  props: ['incident', 'onReset', 'onDelete'],

  template: `
    <li>
      <div class="minor">It has been</div>
      <div class="days">{{ incident.daysSince() }} days</div>
      <div class="minor">since</div>
      <div class="description">{{ incident.description }}.</div>
      <button @click="handleClickReset">Reset</button>
      <button @click="handleClickDelete">Delete</button>
    </li>
  `,

  methods: {
    handleClickReset(event) {
      this.onReset(this.incident);
    },
    handleClickDelete(event) {
      this.onDelete(this.incident);
    },
  },
});

let incidents = null;
try {
  incidents = JSON.parse(localStorage.incidents)
    .map(s => new Incident(s.description, new Date(s.date)));
} catch (err) {
  incidents = [];
}

const app = new Vue({
    el: '#app',

    data: {
        incidents: incidents,
    },

    template: `
      <incident-list
        :incidents="incidents"
        :validate-incident="validateIncident"
        :on-create-new-incident="handleCreateNewIncident"
        :on-reset-incident="handleResetIncident"
        :on-delete-incident="handleDeleteIncident"
        :on-move-incident="handleMoveIncident"
      />
    `,

    methods: {
      handleCreateNewIncident(incident) {
        this.incidents.push(incident);
        this.saveIncidents();
      },

      handleResetIncident(incident) {
        const index = this.incidents.findIndex(i => i.description === incident.description);
        if (index === -1) {
          throw new Error(`Could not find incident with description "${incident.description}".`);
        }
        Vue.set(this.incidents, index, new Incident(incident.description));
        this.saveIncidents();
      },

      handleDeleteIncident(incident) {
        this.incidents = this.incidents.filter(i => i.description !== incident.description);
        this.saveIncidents();
      },

      validateIncident(incident) {
        if (this.incidents.find(i => i.description === incident.description)) {
          return 'An incident with that description already exists.';
        }

        return false;
      },

      saveIncidents() {
        const savedIncidents = [];
        for (const incident of this.incidents) {
          savedIncidents.push({
            description: incident.description,
            date: incident.date,
          });
        }
        localStorage.incidents = JSON.stringify(savedIncidents);
      },

      handleMoveIncident(fromIndex, toIndex) {
        if (fromIndex === toIndex) {
          return;
        }

        const incident = this.incidents.splice(fromIndex, 1)[0];
        this.incidents.splice(toIndex, 0, incident);
        this.saveIncidents();
      },
    },
});
