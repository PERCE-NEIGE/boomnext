class BaseParser {
	constructor() {
		this.videos = [];
		this.currentVideoIndex = -1;
		this.currentPageIndex = 0;
	}

	ajax(url) {
		const promise = new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onload = function() {
				if (this.status >= 200 && this.status < 300) resolve(this.responseText);
				else reject(`ajax failed for ${url}, because ${this.statusText}`);
			};
			if (this.requestHeader) {
				xhr.setRequestHeader(...this.requestHeader);
			}
			xhr.onerror = (event) => {
				reject(`Error requesting ${this.parserName}`);
			};
			xhr.send();
		});
		return promise;
	}

	getVideosFromIndex(index) {
		// Return promise if resolved we got the index page a
		// whole bunch of new videos.
	}

	getNext() {
		const promise = new Promise((resolve, reject) => {

			// only increment if we are not at the last video
			if (this.currentVideoIndex < this.videos.length) {
				this.currentVideoIndex++;
			}

			// no videos left, we must wait before we can return a new video
			if (this.currentVideoIndex >= this.videos.length - 1) {
				this.getVideosFromIndex().then(() => {
					resolve(this.videos[this.currentVideoIndex]);
				}, err => {
					--this.currentPageIndex;
					reject(err);
				});
			} else {
				// 3 before last, request next index page to get more videos
				if (this.currentVideoIndex >= this.videos.length - 4) {
					this.getVideosFromIndex();
				}
				resolve(this.videos[this.currentVideoIndex]);
			}
		});
		return promise;
	}

	getPrev() {
		if (this.currentVideoIndex > 0) {
			this.currentVideoIndex--;
		}
		return this.videos[this.currentVideoIndex];
	}
}

// ---
class Imgur2 extends BaseParser {
	constructor() {
		super();
		this.baseURL = 'https://api.imgur.com/3/gallery/hot/viral/';
		this.requestHeader = ['Authorization', 'Client-ID c35fbc04fe9ccda'];
		// this.videos = []; // provided in base
		this.parserName = 'imgur API';
		this.currentPageIndex = 0;
		this.parserRunning = false;
	}

	getVideosFromIndex() {
		const url = `${this.baseURL}${this.currentPageIndex}.json`;
		if (!this.parserRunning) {
			this.parserRunning = true;
			return this.ajax(url).then(rawJsonIndex => {
				this.parserRunning = false;
				++this.currentPageIndex;
				this.videos = [
					...this.videos,
					...JSON.parse(rawJsonIndex).data
						.filter(item => item.mp4)
						.map(item => ({
							id: item.mp4,
							mp4: item.mp4,
						})),
				];
			});
		} else {
			console.warn('imgur index is already running!!!');
			debugger;
		}
	}
}


(function() {
	window.parsers.Imgur2 = new Imgur2();
	console.log('added parser Imgur2');
})();
