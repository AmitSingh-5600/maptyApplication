'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcpace();
    this._setDiscription();
  }
  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  calcpace() {
    this.pace = this.duration / this.distance;
  }

  
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcspeed();
    this._setDiscription();
  }

  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  calcspeed() {
    this.speed = this.distance / this.duration;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    //get position
    this._getPosition();
    //get local storage
    this._getLocalStorage();

    //attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  _getPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => this._loadMap.call(this, position),
        error => this._loadMapFailure.call(this, error)
      );
    }
  }

  _loadMapFailure(error) {
    alert(`Could not get your position ${error}`);
  }

  _loadMap(position) {
    const {
      coords: { latitude, longitude },
    } = position;

    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout))
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.classList.add('hidden');
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    event.preventDefault();

    let validInputs = (...values) => values.every(v => Number.isFinite(v));
    let allPositive = (...values) => values.every(value => value > 0);
    let workout;

    const {
      latlng: { lat, lng },
    } = this.#mapEvent;

    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;

    if (type === 'running') {
      let cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('inputs have to be positive numbers');
      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }
    if (type === 'cycling') {
      let elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('inputs have to be positive numbers');
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
    }

    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id=${
      workout.id
    }>
    <h2 class="workout__title">${workout.discription}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem("workouts"));

    if(!data) return;

    this.#workouts = data;

    this.#workouts.forEach(workout => this._renderWorkout(workout))
  }


  reset(){
    localStorage.removeItem("workouts");
    location.reload();
  }

  
}

const user = new App();
