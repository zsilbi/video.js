/**
 * @file chapters-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import ChaptersTrackMenuItem from './chapters-track-menu-item.js';
import {toTitleCase} from '../../utils/str.js';

/**
 * The button component for toggling and selecting chapters
 * Chapters act much differently than other text tracks
 * Cues are navigation vs. other tracks of alternative languages
 *
 * @extends TextTrackButton
 */
class ChaptersButton extends TextTrackButton {

  /**
   * Creates an instance of this class.
   *
   * @param { import('../../player').default } player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Function} [ready]
   *        The function to call when this function is ready.
   */
  constructor(player, options, ready) {
    super(player, options, ready);

    this.selectCurrentItem_ = () => {
      this.items.forEach(item => {
        item.selected(this.track_.activeCues[0] === item.cue);
      });
    };
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-chapters-button ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {
    return `vjs-chapters-button ${super.buildWrapperCSSClass()}`;
  }

  /**
   * Update the menu based on the current state of its items.
   *
   * @param {Event} [event]
   *        An event that triggered this function to run.
   *
   * @listens TextTrackList#addtrack
   * @listens TextTrackList#removetrack
   * @listens TextTrackList#change
   */
  update(event) {
    if (event && event.track && event.track.kind !== 'chapters') {
      return;
    }

    const track = this.findChaptersTrack();

    if (track !== this.track_) {
      this.setTrack(track);
      super.update();
    } else if (!this.items || (track && track.cues && track.cues.length !== this.items.length)) {
      // Update the menu initially or if the number of cues has changed since set
      super.update();
    }
  }

  /**
   * Set the currently selected track for the chapters button.
   *
   * @param {TextTrack} track
   *        The new track to select. Nothing will change if this is the currently selected
   *        track.
   */
  setTrack(track) {
    if (this.track_ === track) {
      return;
    }

    if (!this.updateHandler_) {
      this.updateHandler_ = this.update.bind(this);
    }

    // here this.track_ refers to the old track instance
    if (this.track_) {
      const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
      }

      this.track_.removeEventListener('cuechange', this.selectCurrentItem_);

      this.track_ = null;
    }

    this.track_ = track;

    // here this.track_ refers to the new track instance
    if (this.track_) {
      this.track_.mode = 'hidden';

      const remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.addEventListener('load', this.updateHandler_);
      }

      this.track_.addEventListener('cuechange', this.selectCurrentItem_);
    }
  }

  /**
   * Find the track object that is currently in use by this ChaptersButton
   *
   * @return {TextTrack|undefined}
   *         The current track or undefined if none was found.
   */
  findChaptersTrack() {
    const tracks = this.player_.textTracks() || [];

    for (let i = tracks.length - 1; i >= 0; i--) {
      // We will always choose the last track as our chaptersTrack
      const track = tracks[i];

      if (track.kind === this.kind_) {
        return track;
      }
    }
  }

  /**
   * Get the caption for the ChaptersButton based on the track label. This will also
   * use the current tracks localized kind as a fallback if a label does not exist.
   *
   * @return {string}
   *         The tracks current label or the localized track kind.
   */
  getMenuCaption() {
    if (this.track_ && this.track_.label) {
      return this.track_.label;
    }
    return this.localize(toTitleCase(this.kind_));
  }

  /**
   * Create menu from chapter track
   *
   * @return { import('../../menu/menu').default }
   *         New menu for the chapter buttons
   */
  createMenu() {
    this.options_.title = this.getMenuCaption();
    return super.createMenu();
  }

  /**
   * Create a menu item for each text track
   *
   * @return  { import('./text-track-menu-item').default[] }
   *         Array of menu items
   */
  createItems() {
    const items = [];

    if (!this.track_) {
      return items;
    }

    const cues = this.track_.cues;

    if (!cues) {
      return items;
    }

    for (let i = 0, l = cues.length; i < l; i++) {
      const cue = cues[i];
      const mi = new ChaptersTrackMenuItem(this.player_, { track: this.track_, cue });

      items.push(mi);
    }

    return items;
  }

}

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */
ChaptersButton.prototype.kind_ = 'chapters';

/**
 * The text that should display over the `ChaptersButton`s controls. Added for localization.
 *
 * @type {string}
 * @protected
 */
ChaptersButton.prototype.controlText_ = 'Chapters';

Component.registerComponent('ChaptersButton', ChaptersButton);
export default ChaptersButton;
