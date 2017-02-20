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
  ],

  data() {
    return {
      showNewForm: false,
    };
  },

  template: `
    <ul>
      <incident-list-item
        v-for="incident in incidents"
        :key="incident.description"
        :incident="incident"
        :on-reset="onResetIncident"
        :on-delete="onDeleteIncident"
      />
      <li v-if="!showNewForm" @click="handleClickAddNew">
        Add new
      </li>
      <incident-form
        v-else
        :on-submit="handleSubmitNew"
        :validate-incident="validateIncident"
      />
    </ul>
  `,

  methods: {
    handleClickAddNew(event) {
      this.showNewForm = true;
    },

    handleSubmitNew(incident) {
      this.onCreateNewIncident(incident);
      this.showNewForm = false;
    },
  },
});

Vue.component('incident-form', {
  props: ['incident', 'onSubmit', 'validateIncident'],

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
        <h2>
          It has been
          <input type="text" class="field" v-model.number="days" size="2">
          days since
          <input type="text" class="field" v-model.trim="description">
          .
        </h2>
        <div v-if="error" class="error">{{ this.error }}</div>
        <button type="submit">Save</button>
      </form>
    </li>
  `,

  methods: {
    handleSubmit(event) {
      event.preventDefault();
      const incidentDate = new Date();
      incidentDate.setDate(incidentDate.getDate() - this.days);
      const incident = new Incident(this.description, incidentDate);

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
      <h2>It has been {{ incident.daysSince() }} days since {{ incident.description }}.</h2>
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
      }
    },
});
