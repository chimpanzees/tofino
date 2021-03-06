/*
Copyright 2016 Mozilla

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
*/

import { ipcRenderer, remote } from '../../../shared/electron';

const { systemPreferences } = remote;

// Check only on startup -- can handle changes in the future, but not
// something people are toggling in the OS while using this prototype.
// Only OSX has this function.
const SWIPE_ENABLED = systemPreferences.isSwipeTrackingFromScrollEventsEnabled ?
  systemPreferences.isSwipeTrackingFromScrollEventsEnabled() :
  false;

// The duration of the swipe must atleast be this value, in ms.
const SWIPE_TIME_THRESHOLD = 50;

// The Y movement of the swipe must be less than this, in pixels.
// This is to distinguish from scrolling up/down a page.
const SWIPE_DELTA_Y_THRESHOLD = 100;

// The X movement of the swipe must be greater than this, in pixels.
const SWIPE_DELTA_X_THRESHOLD = 100;

export const attachGestureListeners = () => {
  let moving = false;
  let startTime = 0;
  let time = 0;
  let deltaX = 0;
  let deltaY = 0;

  window.addEventListener('wheel', e => {
    if (moving) {
      deltaX += e.deltaX;
      deltaY += e.deltaY;
      time = Date.now() - startTime;
    }
  }, { passive: true });

  ipcRenderer.on('scroll-touch-begin', () => {
    if (SWIPE_ENABLED) {
      moving = true;
      startTime = Date.now();
    }
  });

  ipcRenderer.on('scroll-touch-end', () => {
    if (time > SWIPE_TIME_THRESHOLD &&
        moving &&
        Math.abs(deltaY) < SWIPE_DELTA_Y_THRESHOLD) {
      if (deltaX > SWIPE_DELTA_X_THRESHOLD && SWIPE_ENABLED) {
        ipcRenderer.emit('go-forward');
      } else if (deltaX < -SWIPE_DELTA_X_THRESHOLD && SWIPE_ENABLED) {
        ipcRenderer.emit('go-back');
      }
    }
    moving = false;
    deltaX = 0;
    deltaY = 0;
  });
};
