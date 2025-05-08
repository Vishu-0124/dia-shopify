/*jshint -W087 */
/*jshint sub:true*/
/*jshint esnext: true */
/*jshint loopfunc:true */

// CustomEvent polyfill
(function () {
    if (typeof window.CustomEvent === "function") return false; //If not IE

    function CustomEvent(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(
            event,
            params.bubbles,
            params.cancelable,
            params.detail
        );
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

if (typeof theme === "undefined") {
    theme = {};
}
var html = $("html");
var body = $("body");
var winWidth = $(window).width();
var winHeight = $(window).height();
theme.mobileBrkp = 768;
theme.tabletBrkp = 981;

theme.LibraryLoader = (function () {
    var types = {
        link: 'link',
        script: 'script'
    };

    var status = {
        requested: 'requested',
        loaded: 'loaded'
    };

    var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';

    var libraries = {
        youtubeSdk: {
            tagId: 'youtube-sdk',
            src: 'https://www.youtube.com/iframe_api',
            type: types.script
        },
        plyr: {
            tagId: 'plyr',
            src: 'https://cdn.shopify.com/s/files/1/2333/0623/t/70/assets/plyr.min.js',
            type: types.script
        },
        plyrShopify: {
            tagId: 'plyr-shopify',
            src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr-legacy.en.js',
            type: types.script
        },
        plyrShopifyStyles: {
            tagId: 'plyr-shopify-styles',
            src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr.css',
            type: types.link
        },
        shopifyXr: {
            tagId: 'shopify-model-viewer-xr',
            src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
            type: types.script
        },
        modelViewerUi: {
            tagId: 'shopify-model-viewer-ui',
            src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
            type: types.script
        },
        modelViewerUiStyles: {
            tagId: 'shopify-model-viewer-ui-styles',
            src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
            type: types.link
        }
    };

    function load(libraryName, callback) {
        var library = libraries[libraryName];

        if (!library) return;
        if (library.status === status.requested) return;

        callback = callback || function () {
        };
        if (library.status === status.loaded) {
            callback();
            return;
        }

        library.status = status.requested;

        var tag;

        switch (library.type) {
            case types.script:
                tag = createScriptTag(library, callback);
                break;
            case types.link:
                tag = createLinkTag(library, callback);
                break;
        }

        tag.id = library.tagId;
        library.element = tag;

        var firstScriptTag = document.getElementsByTagName(library.type)[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    function createScriptTag(library, callback) {
        var tag = document.createElement('script');
        tag.src = library.src;
        tag.addEventListener('load', function () {
            library.status = status.loaded;
            callback();
        });
        return tag;
    }

    function createLinkTag(library, callback) {
        var tag = document.createElement('link');
        tag.href = library.src;
        tag.rel = 'stylesheet';
        tag.type = 'text/css';
        tag.addEventListener('load', function () {
            library.status = status.loaded;
            callback();
        });
        return tag;
    }

    return {
        load: load
    };
})();

theme.homeMaps = function () {
    mapInit = function (mapId, mapSection, mapAddress, mapStyle, mapPin) {
        var geocoder;
        var map;

        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(1, 1);
        var myOptions = {
            zoom: 14,
            center: latlng,
            disableDefaultUI: true,
            scrollwheel: false,
            keyboardShortcuts: false,
            styles: mapStyles[mapStyle]
        };
        map = new google.maps.Map(document.getElementById(mapId), myOptions);

        if (geocoder) {
            geocoder.geocode({address: mapAddress}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
                        map.setCenter(results[0].geometry.location);

                        var marker = new google.maps.Marker({
                            position: results[0].geometry.location,
                            map: map,
                            icon: window[mapPin]
                        });
                    }
                }
            });
        }
    };

    theme.runMap = function (map) {
        var thisMap = $("#" + map);

        var mapId = thisMap.data("map-id");
        var mapSection = thisMap.data("map-section");
        var mapAddress = thisMap.data("map-address");
        var mapStyle = thisMap.data("map-style");
        var mapPin = thisMap.data("map-pin");

        mapInit(mapId, mapSection, mapAddress, mapStyle, mapPin);
    };

    function eachMapInit() {
        $(".js-map-ids").each(function () {
            var thisMapId = $(this).data("map-id");
            theme.runMap(thisMapId);
        });
    }

    //home map accordion
    function mapTrigger() {
        var item = $(".js-map-info");
        var trigger = $(".js-map-trigger");
        var items = item.hide(); //hide all items
        var activeClass = "js-active";

        //show and acivate first item in each map
        $(".js-map").each(function (i) {
            $(this)
                .find(item)
                .first()
                .addClass(activeClass)
                .show();
            $(this)
                .find(trigger)
                .first()
                .addClass(activeClass);
        });

        trigger.click(function () {
            var thisItem = $(this).attr("href");
            var theseItems = $(thisItem)
                .parents(".js-map")
                .find(".js-map-info");

            //check if info is not active
            if (!$(thisItem).hasClass(activeClass)) {
                theseItems.removeClass(activeClass).slideUp();
                $(thisItem)
                    .addClass(activeClass)
                    .slideDown();
            }

            //map canvas functions
            $(this)
                .parents(".js-map")
                .find(".js-map-media")
                .removeClass(activeClass); //hide all within section
            $('.js-map-media[data-map-id="' + thisItem + '"]').addClass(activeClass); //show active

            //run current map function if it's hidden within tab
            if ($(thisItem).find(".home-map__media-canvas").length) {
                var thisMapId = $(thisItem)
                    .find(".home-map__media-canvas")
                    .attr("id");

                if (typeof thisMapId != "undefined") {
                    theme.runMap(thisMapId);
                }
            }

            //check if info is not active
            if (!$(this).hasClass(activeClass)) {
                trigger.removeClass(activeClass);
                $(this).addClass(activeClass);
            }

            return false;
        });
    }

    mapTrigger();

    //lazily initiate google maps
    var lazyMap = new LazyLoad({
        elements_selector: ".js-lazy-map",
        callback_set: function (el) {
            if ($(".js-map-ids").length > 0) {
                if (typeof window.google === "undefined") {
                    //get google key or set empty var
                    var google_key;
                    if (typeof theme.map.key !== "undefined") {
                        google_key = theme.map.key;
                    } else {
                        google_key = "";
                    }

                    $.getScript(
                        "https://maps.googleapis.com/maps/api/js?key=" + google_key
                    ).then(function () {
                        //set SVG map pins
                        mapPinDark = {
                            path:
                                "M50,9.799c-15.188,0-27.499,12.312-27.499,27.499S50,90.201,50,90.201s27.499-37.715,27.499-52.902S65.188,9.799,50,9.799z   M50,44.813c-4.15,0-7.515-3.365-7.515-7.515S45.85,29.784,50,29.784s7.514,3.365,7.514,7.515S54.15,44.813,50,44.813z",
                            fillColor: "#000000",
                            anchor: new google.maps.Point(55, 85),
                            fillOpacity: 1,
                            scale: 0.6,
                            strokeWeight: 0
                        };
                        mapPinLight = {
                            path:
                                "M50,9.799c-15.188,0-27.499,12.312-27.499,27.499S50,90.201,50,90.201s27.499-37.715,27.499-52.902S65.188,9.799,50,9.799z   M50,44.813c-4.15,0-7.515-3.365-7.515-7.515S45.85,29.784,50,29.784s7.514,3.365,7.514,7.515S54.15,44.813,50,44.813z",
                            fillColor: "#ffffff",
                            anchor: new google.maps.Point(55, 85),
                            fillOpacity: 1,
                            scale: 0.6,
                            strokeWeight: 0
                        };
                        mapStyles = {
                            light: [
                                {
                                    featureType: "water",
                                    elementType: "geometry",
                                    stylers: [{color: "#e9e9e9"}, {lightness: 17}]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "geometry",
                                    stylers: [{color: "#f0f0f0"}, {lightness: 20}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#ffffff"}, {lightness: 17}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "geometry.stroke",
                                    stylers: [
                                        {color: "#ffffff"},
                                        {lightness: 29},
                                        {weight: 0.2}
                                    ]
                                },
                                {
                                    featureType: "road.arterial",
                                    elementType: "geometry",
                                    stylers: [{color: "#ffffff"}, {lightness: 18}]
                                },
                                {
                                    featureType: "road.local",
                                    elementType: "geometry",
                                    stylers: [{color: "#ffffff"}, {lightness: 16}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "geometry",
                                    stylers: [{color: "#f0f0f0"}, {lightness: 21}]
                                },
                                {
                                    featureType: "poi.park",
                                    elementType: "geometry",
                                    stylers: [{color: "#dedede"}, {lightness: 21}]
                                },
                                {
                                    elementType: "labels.text.stroke",
                                    stylers: [
                                        {visibility: "on"},
                                        {color: "#ffffff"},
                                        {lightness: 16}
                                    ]
                                },
                                {
                                    elementType: "labels.text.fill",
                                    stylers: [
                                        {saturation: 36},
                                        {color: "#333333"},
                                        {lightness: 40}
                                    ]
                                },
                                {
                                    elementType: "labels.icon",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "transit",
                                    elementType: "geometry",
                                    stylers: [{color: "#f2f2f2"}, {lightness: 19}]
                                },
                                {
                                    featureType: "administrative",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#fefefe"}, {lightness: 20}]
                                },
                                {
                                    featureType: "administrative",
                                    elementType: "geometry.stroke",
                                    stylers: [
                                        {color: "#fefefe"},
                                        {lightness: 17},
                                        {weight: 1.2}
                                    ]
                                }
                            ],
                            dark: [
                                {
                                    featureType: "all",
                                    elementType: "labels.text.fill",
                                    stylers: [
                                        {saturation: 36},
                                        {color: "#000000"},
                                        {lightness: 40}
                                    ]
                                },
                                {
                                    featureType: "all",
                                    elementType: "labels.text.stroke",
                                    stylers: [
                                        {visibility: "on"},
                                        {color: "#000000"},
                                        {lightness: 16}
                                    ]
                                },
                                {
                                    featureType: "all",
                                    elementType: "labels.icon",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "administrative",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#000000"}, {lightness: 20}]
                                },
                                {
                                    featureType: "administrative",
                                    elementType: "geometry.stroke",
                                    stylers: [
                                        {color: "#000000"},
                                        {lightness: 17},
                                        {weight: 1.2}
                                    ]
                                },
                                {
                                    featureType: "administrative",
                                    elementType: "labels",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "administrative.country",
                                    elementType: "all",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "administrative.country",
                                    elementType: "geometry",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "administrative.country",
                                    elementType: "labels.text",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "administrative.province",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "administrative.locality",
                                    elementType: "all",
                                    stylers: [
                                        {visibility: "simplified"},
                                        {saturation: "-100"},
                                        {lightness: "30"}
                                    ]
                                },
                                {
                                    featureType: "administrative.neighborhood",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "administrative.land_parcel",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "all",
                                    stylers: [
                                        {visibility: "simplified"},
                                        {gamma: "0.00"},
                                        {lightness: "74"}
                                    ]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "geometry",
                                    stylers: [{color: "#000000"}, {lightness: 20}]
                                },
                                {
                                    featureType: "landscape.man_made",
                                    elementType: "all",
                                    stylers: [{lightness: "3"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "geometry",
                                    stylers: [{color: "#000000"}, {lightness: 21}]
                                },
                                {
                                    featureType: "road",
                                    elementType: "geometry",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#000000"}, {lightness: 17}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "geometry.stroke",
                                    stylers: [
                                        {color: "#000000"},
                                        {lightness: 29},
                                        {weight: 0.2}
                                    ]
                                },
                                {
                                    featureType: "road.arterial",
                                    elementType: "geometry",
                                    stylers: [{color: "#000000"}, {lightness: 18}]
                                },
                                {
                                    featureType: "road.local",
                                    elementType: "geometry",
                                    stylers: [{color: "#000000"}, {lightness: 16}]
                                },
                                {
                                    featureType: "transit",
                                    elementType: "geometry",
                                    stylers: [{color: "#000000"}, {lightness: 19}]
                                },
                                {
                                    featureType: "water",
                                    elementType: "geometry",
                                    stylers: [{color: "#000000"}, {lightness: 17}]
                                }
                            ],
                            flat: [
                                {
                                    featureType: "administrative",
                                    elementType: "labels.text.fill",
                                    stylers: [{color: "#6195a0"}]
                                },
                                {
                                    featureType: "administrative.province",
                                    elementType: "geometry.stroke",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "geometry",
                                    stylers: [
                                        {lightness: "0"},
                                        {saturation: "0"},
                                        {color: "#f5f5f2"},
                                        {gamma: "1"}
                                    ]
                                },
                                {
                                    featureType: "landscape.man_made",
                                    elementType: "all",
                                    stylers: [{lightness: "-3"}, {gamma: "1.00"}]
                                },
                                {
                                    featureType: "landscape.natural.terrain",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "poi.park",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#bae5ce"}, {visibility: "on"}]
                                },
                                {
                                    featureType: "road",
                                    elementType: "all",
                                    stylers: [
                                        {saturation: -100},
                                        {lightness: 45},
                                        {visibility: "simplified"}
                                    ]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "all",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#fac9a9"}, {visibility: "simplified"}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "labels.text",
                                    stylers: [{color: "#4e4e4e"}]
                                },
                                {
                                    featureType: "road.arterial",
                                    elementType: "labels.text.fill",
                                    stylers: [{color: "#787878"}]
                                },
                                {
                                    featureType: "road.arterial",
                                    elementType: "labels.icon",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "transit",
                                    elementType: "all",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "transit.station.airport",
                                    elementType: "labels.icon",
                                    stylers: [
                                        {hue: "#0a00ff"},
                                        {saturation: "-77"},
                                        {gamma: "0.57"},
                                        {lightness: "0"}
                                    ]
                                },
                                {
                                    featureType: "transit.station.rail",
                                    elementType: "labels.text.fill",
                                    stylers: [{color: "#43321e"}]
                                },
                                {
                                    featureType: "transit.station.rail",
                                    elementType: "labels.icon",
                                    stylers: [
                                        {hue: "#ff6c00"},
                                        {lightness: "4"},
                                        {gamma: "0.75"},
                                        {saturation: "-68"}
                                    ]
                                },
                                {
                                    featureType: "water",
                                    elementType: "all",
                                    stylers: [{color: "#eaf6f8"}, {visibility: "on"}]
                                },
                                {
                                    featureType: "water",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#c7eced"}]
                                },
                                {
                                    featureType: "water",
                                    elementType: "labels.text.fill",
                                    stylers: [
                                        {lightness: "-49"},
                                        {saturation: "-53"},
                                        {gamma: "0.79"}
                                    ]
                                }
                            ],
                            clean_cut: [
                                {
                                    featureType: "road",
                                    elementType: "geometry",
                                    stylers: [{lightness: 100}, {visibility: "simplified"}]
                                },
                                {
                                    featureType: "water",
                                    elementType: "geometry",
                                    stylers: [{visibility: "on"}, {color: "#C6E2FF"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#C5E3BF"}]
                                },
                                {
                                    featureType: "road",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#D1D1B8"}]
                                }
                            ],
                            minimal_dark: [
                                {
                                    featureType: "all",
                                    elementType: "all",
                                    stylers: [
                                        {hue: "#ff0000"},
                                        {saturation: -100},
                                        {lightness: -30}
                                    ]
                                },
                                {
                                    featureType: "all",
                                    elementType: "labels.text.fill",
                                    stylers: [{color: "#ffffff"}]
                                },
                                {
                                    featureType: "all",
                                    elementType: "labels.text.stroke",
                                    stylers: [{color: "#353535"}]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "geometry",
                                    stylers: [{color: "#656565"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "geometry.fill",
                                    stylers: [{color: "#505050"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "geometry.stroke",
                                    stylers: [{color: "#808080"}]
                                },
                                {
                                    featureType: "road",
                                    elementType: "geometry",
                                    stylers: [{color: "#454545"}]
                                },
                                {
                                    featureType: "transit",
                                    elementType: "labels",
                                    stylers: [
                                        {hue: "#000000"},
                                        {saturation: 100},
                                        {lightness: -40},
                                        {invert_lightness: true},
                                        {gamma: 1.5}
                                    ]
                                }
                            ],
                            blue_water: [
                                {
                                    featureType: "administrative",
                                    elementType: "labels.text.fill",
                                    stylers: [{color: "#444444"}]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "all",
                                    stylers: [{color: "#f2f2f2"}]
                                },
                                {
                                    featureType: "poi",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "road",
                                    elementType: "all",
                                    stylers: [{saturation: -100}, {lightness: 45}]
                                },
                                {
                                    featureType: "road.highway",
                                    elementType: "all",
                                    stylers: [{visibility: "simplified"}]
                                },
                                {
                                    featureType: "road.arterial",
                                    elementType: "labels.icon",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "transit",
                                    elementType: "all",
                                    stylers: [{visibility: "off"}]
                                },
                                {
                                    featureType: "water",
                                    elementType: "all",
                                    stylers: [{color: "#46bcec"}, {visibility: "on"}]
                                }
                            ]
                        };
                        eachMapInit();
                    });
                } else {
                    eachMapInit();
                }
            }
        }
    });
};

theme.layoutSlider = function (slider) {
    $(window)
        .resize(function () {
            //get sizes
            winWidth = $(window).width();
            var thisSlider = $(slider);

            if (winWidth < theme.mobileBrkp) {
                thisSlider.not(".slick-initialized").slick({
                    slidesToShow: 1,
                    infinite: false,
                    dots: true,
                    arrows: false,
                    centerMode: true,
                    centerPadding: "30px"
                });
            } else {
                //check if slick is initiated
                if (thisSlider.hasClass("slick-initialized")) {
                    //detach slick
                    thisSlider.slick("unslick");
                }
            }
            thisSlider.on("afterChange", function (event, slick, currentSlide) {
                $(this)
                    .find(".slick-current")
                    .addClass("js-slide-seen");
            });
        })
        .resize();
};

theme.productCollSwatch = function () {
    $('.product__swatch__item').click(function () {
        var currentProduct = $(this).parents('.js-product');
        var currentProudctImage = currentProduct.find('.product__img');
        var variantProductImage = $(this).data('variant-image');
        var variantUrl = $(this).data('variant-url');

        //replace product image
        currentProudctImage.attr('data-src', variantProductImage);
        currentProudctImage.addClass('lazyload');

        //replace product variant link
        currentProduct.find('.js-product-link').attr('href', variantUrl);

        //set swatch to active
        currentProduct.find('.js-product-swatch-item').removeClass('js-active');
        $(this).addClass('js-active');

        return false;
    });
};

// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
    theme.ProductVideo.loadVideos(theme.ProductVideo.hosts.youtube);
}

theme.ProductVideo = (function () {
    var productCarousel = $('.js-product-slider');

    var videos = {};

    var hosts = {
        html5: 'html5',
        youtube: 'youtube'
    };

    var selectors = {
        productMediaWrapper: '[data-product-media-wrapper]'
    };

    var attributes = {
        enableVideoLooping: 'enable-video-looping',
        videoId: 'video-id'
    };

    function init(videoContainer, sectionId) {
        if (!videoContainer.length) {
            return;
        }

        var videoElement = videoContainer.find('iframe, video')[0];
        var mediaId = videoContainer.data('mediaId');

        if (!videoElement) {
            return;
        }

        videos[mediaId] = {
            mediaId: mediaId,
            sectionId: sectionId,
            host: hostFromVideoElement(videoElement),
            container: videoContainer,
            element: videoElement,
            ready: function () {
                createPlayer(this);
            }
        };

        var video = videos[mediaId];

        switch (video.host) {
            case hosts.html5:
                theme.LibraryLoader.load(
                    'plyrShopify',
                    loadVideos.bind(this, hosts.html5)
                );
                theme.LibraryLoader.load('plyrShopifyStyles');
                break;
            case hosts.youtube:
                theme.LibraryLoader.load('youtubeSdk');
                break;
        }
    }

    function createPlayer(video) {
        if (video.player) {
            return;
        }

        var productMediaWrapper = video.container.closest(
            selectors.productMediaWrapper
        );
        var enableLooping = productMediaWrapper.data(attributes.enableVideoLooping);

        switch (video.host) {
            case hosts.html5:
                // eslint-disable-next-line no-undef
                video.player = new Shopify.Plyr(video.element, {
                    controls: [
                        'play',
                        'progress',
                        'mute',
                        'volume',
                        'play-large',
                        'fullscreen'
                    ],
                    loop: {active: enableLooping},
                    hideControlsOnPause: true,
                    iconUrl:
                        '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
                    tooltips: {controls: false, seek: true}
                });
                break;
            case hosts.youtube:
                var videoId = productMediaWrapper.data(attributes.videoId);

                video.player = new YT.Player(video.element, {
                    videoId: videoId,
                    events: {
                        onStateChange: function (event) {
                            if (event.data === 0 && enableLooping) event.target.seekTo(0);
                        }
                    }
                });
                break;
        }

        //on media reveal
        productCarousel.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            var thisSectionId = $(this).parents('.section').data('section-id');
            if (thisSectionId == video.sectionId) {
                if (video.container.data('slide-id') == nextSlide) {
                    if (!Modernizr.touchevents) {
                        if (nextSlide !== currentSlide) {//check if is first slide and is first load
                            setTimeout(function () {
                                if (video.host === hosts.html5) {
                                    video.player.play();
                                }
                                if (video.host === hosts.youtube && video.player.playVideo) {
                                    video.player.playVideo();
                                }
                            }, 300);
                        }
                    }
                }
            }
        });
        //on media hidden
        productCarousel.on('afterChange', function (event, slick, currentSlide) {
            var thisSectionId = $(this).parents('.section').data('section-id');
            if (thisSectionId == video.sectionId) {
                if (video.container.data('slide-id') != currentSlide) {
                    if (video.host === hosts.html5) {
                        video.player.pause();
                    }
                    if (video.host === hosts.youtube && video.player.pauseVideo) {
                        video.player.pauseVideo();
                    }
                }
            }
        });

        //on XR launch
        $(document).on('shopify_xr_launch', function () {
            if (video.host === hosts.html5) {
                video.player.pause();
            }
            if (video.host === hosts.youtube && video.player.pauseVideo) {
                video.player.pauseVideo();
            }
        });
    }

    function hostFromVideoElement(video) {
        if (video.tagName === 'VIDEO') {
            return hosts.html5;
        }
        if (video.tagName === 'IFRAME') {
            if (
                /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(
                    video.src
                )
            ) {
                return hosts.youtube;
            }
        }
        return null;
    }

    function loadVideos(host) {
        for (var key in videos) {
            if (videos.hasOwnProperty(key)) {
                var video = videos[key];
                if (video.host === host) {
                    video.ready();
                }
            }
        }
    }

    function removeSectionVideos(sectionId) {
        for (var key in videos) {
            if (videos.hasOwnProperty(key)) {
                var video = videos[key];
                if (video.sectionId === sectionId) {
                    if (video.player) video.player.destroy();
                    delete videos[key];
                }
            }
        }
    }

    return {
        init: init,
        hosts: hosts,
        loadVideos: loadVideos,
        removeSectionVideos: removeSectionVideos
    };
})();

theme.ProductModel = (function () {
    var modelJsonSections = {};
    var models = {};
    var xrButtons = {};
    var productCarousel = $('.js-product-slider');

    var selectors = {
        mediaGroup: '[data-product-media-group]',
        xrButton: '[data-shopify-xr]'
    };

    function init(modelViewerContainers, sectionId) {
        modelJsonSections[sectionId] = {
            loaded: false
        };

        modelViewerContainers.each(function (index) {
            var $modelViewerContainer = $(this);
            var mediaId = $modelViewerContainer.data('media-id');
            var $modelViewerElement = $(
                $modelViewerContainer.find('model-viewer')[0]
            );
            var modelId = $modelViewerElement.data('model-id');

            if (index === 0) {
                var $xrButton = $modelViewerContainer
                    .closest(selectors.mediaGroup)
                    .find(selectors.xrButton);
                xrButtons[sectionId] = {
                    $element: $xrButton,
                    defaultId: modelId
                };
            }

            models[mediaId] = {
                modelId: modelId,
                sectionId: sectionId,
                $container: $modelViewerContainer,
                $element: $modelViewerElement
            };
        });

        window.Shopify.loadFeatures([
            {
                name: 'shopify-xr',
                version: '1.0',
                onLoad: setupShopifyXr
            },
            {
                name: 'model-viewer-ui',
                version: '1.0',
                onLoad: setupModelViewerUi
            }
        ]);
        theme.LibraryLoader.load('modelViewerUiStyles');
    }

    function setupShopifyXr(errors) {
        if (errors) return;

        if (!window.ShopifyXR) {
            document.addEventListener('shopify_xr_initialized', function () {
                setupShopifyXr();
            });
            return;
        }

        for (var sectionId in modelJsonSections) {
            if (modelJsonSections.hasOwnProperty(sectionId)) {
                var modelSection = modelJsonSections[sectionId];

                if (modelSection.loaded) continue;
                var $modelJson = $('#ModelJson-' + sectionId);

                window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
                modelSection.loaded = true;
            }
        }
        window.ShopifyXR.setupXRElements();
    }

    function setupModelViewerUi(errors) {
        if (errors) {
            // When loadFeature is implemented, you can console or throw errors by doing something like this:
            // errors.forEach((error) => { console.warn(error.message); });
            return;
        }
        for (var key in models) {
            if (models.hasOwnProperty(key)) {
                var model = models[key];
                if (!model.modelViewerUi) {
                    model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
                }
                setupModelViewerListeners(model);
            }
        }
    }

    function setupModelViewerListeners(model) {
        var xrButton = xrButtons[model.sectionId];

        //on media reveal
        productCarousel.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            var thisSectionId = $(this).parents('.section').data('section-id');
            if (thisSectionId == model.sectionId) {
                if (model.$container.data('slide-id') == nextSlide) {
                    if (!Modernizr.touchevents) {
                        if (nextSlide !== currentSlide) {//check if is first slide and is first load
                            xrButton.$element.attr('data-shopify-model3d-id', model.modelId);
                            setTimeout(function () {
                                model.modelViewerUi.play();
                            }, 300);
                        }
                    }
                    $(this).slick("slickSetOption", "swipe", false);
                }
            }
        });
        //on media hidden
        productCarousel.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            var thisSectionId = $(this).parents('.section').data('section-id');
            if (thisSectionId == model.sectionId) {
                if (model.$container.data('slide-id') == currentSlide && model.$container.data('slide-id') != nextSlide) {
                    xrButton.$element.attr('data-shopify-model3d-id', xrButton.defaultId);
                    model.modelViewerUi.pause();
                    $(this).slick("slickSetOption", "swipe", true);
                }
            }
        });

        //on XR launch
        $(document).on('shopify_xr_launch', function () {
            model.modelViewerUi.pause();
        });
    }

    function removeSectionModels(sectionId) {
        for (var key in models) {
            if (models.hasOwnProperty(key)) {
                var model = models[key];
                if (model.sectionId === sectionId) {
                    delete models[key];
                }
            }
        }
        delete modelJsonSections[sectionId];
    }

    return {
        init: init,
        removeSectionModels: removeSectionModels
    };
})();


theme.productMediaInit = function () {
    $('.product-single__photo__item--video').each(function (index) {
        theme.ProductVideo.init($(this), $('.section--product-single').data('section-id'));
    });
    if ($('.product-single__photo__item--model').length > 0) {
        theme.ProductModel.init($('.product-single__photo__item--model'), $('.section--product-single').data('section-id'));
    }
};

theme.homeProductMediaInit = function () {
    $('.product-featured__photo__item--video').each(function (index) {
        theme.ProductVideo.init($(this), $(this).parents('.section').data('section-id'));
    });
    $('.js-section__home-product').each(function (index) {
        if ($(this).has('.product-featured__photo__item--model').length) {
            theme.ProductModel.init($(this).find('.product-featured__photo__item--model'), $(this).children('.section').data('section-id'));
        }
    });
};

theme.productSelect = function (sectionId, cssClass, historyState) {
    var productObj = document.getElementById("ProductJson-" + sectionId).innerHTML;
    productObj = JSON.parse(productObj || '{}');

    var sectionClass = cssClass;

    var selectCallback = function (variant, selector) {
        var productId = productObj.id;
        sectionClass = sectionClass;

        document.dispatchEvent(
            new CustomEvent("venue:variant:update", {
                bubbles: true,
                detail: {product: productObj, variant: variant, cssClass: cssClass}
            })
        );

        //Price functions
        if (variant) {
            // Selected a valid variant that is available.
            // Variant unit pricing
            if (variant.unit_price_measurement) {
                var unitPrice = $('.js-product-' + productId + ' .js-price-unit-price');
                var unitMeasure = $('.js-product-' + productId + ' .js-price-unit-measure');

                var unitCurrentPrice = Shopify.formatMoney(variant.unit_price, theme.money_format);
                var unitCurrentMeasure = variant.unit_price_measurement.reference_value === 1 ? variant.unit_price_measurement.reference_unit
                    : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;

                unitPrice.html('<span class="money">' + unitCurrentPrice + '</span>');
                unitMeasure.text(unitCurrentMeasure);
                $('.js-product-' + productId + ' .js-price-unit-note').show();
            } else {
                $('.js-product-' + productId + ' .js-price-unit-note').hide();
            }
            if (variant.available) {
                // Variant stock notification
                if (variant.inventory_management) {
                    var qtyLimit = $(".js-product-" + productId + " .js-price-stock-note").data('qty-limit');
                    var variantQty = $(".js-product-" + productId + " .js-product-variant-select option[value=" + variant.id + "]").data("qty");
                    if (variantQty <= qtyLimit) {
                        $(".js-product-" + productId + " .js-price-stock-note").show();
                        $(".js-product-" + productId + " .js-price-stock-note span").text(variantQty);
                    } else {
                        $(".js-product-" + productId + " .js-price-stock-note").hide();
                    }
                } else {
                    $(".js-product-" + productId + " .js-price-stock-note").hide();
                }
                // Enabling add to cart button.
                $(".js-product-" + productId + " .js-product-add")
                    .removeClass("disabled")
                    .addClass("c-btn--plus")
                    .prop("disabled", false)
                    .find(".js-product-add-text")
                    .text(theme.t.add_to_cart);
                $(".js-product-" + productId + " .js-product-buttons").removeClass(
                    "product-single__add--sold"
                );
                // Compare at price
                if (variant.compare_at_price > variant.price) {
                    $(".js-product-" + productId + " .js-product-price-number").html(
                        '<span class="product-' +
                        sectionClass +
                        "__price-number product-" +
                        sectionClass +
                        '__price-number--sale"><span class="money">' +
                        Shopify.formatMoney(variant.price, theme.money_format) +
                        "</span></span>"
                    );
                    $(".js-product-" + productId + " .js-product-price-compare").html(
                        '<s class="product-' +
                        sectionClass +
                        '__price-compare"><span class="money">' +
                        Shopify.formatMoney(
                            variant.compare_at_price,
                            theme.money_format
                        ) +
                        "</span></s>"
                    );
                } else {
                    $(".js-product-" + productId + " .js-product-price-number").html(
                        '<span class="product-' +
                        sectionClass +
                        '__price-number"><span class="money">' +
                        Shopify.formatMoney(variant.price, theme.money_format) +
                        "</span></span>"
                    );
                    $(".js-product-" + productId + " .js-product-price-compare").empty();
                }
            } else {
                // Variant stock notification hide
                $(".js-product-" + productId + " .js-price-stock-note").hide();
                // Variant is sold out.
                $(".js-product-" + productId + " .js-product-add")
                    .addClass("disabled")
                    .removeClass("c-btn--plus")
                    .prop("disabled", true)
                    .find(".js-product-add-text")
                    .text(theme.t.sold_out);
                $(".js-product-" + productId + " .js-product-buttons").addClass(
                    "product-single__add--sold"
                );
                // Compare at price
                if (variant.compare_at_price > variant.price) {
                    $(".js-product-" + productId + " .js-product-price-number").html(
                        '<span class="product-' +
                        sectionClass +
                        "__price-number product-" +
                        sectionClass +
                        '__price-number--sale"><span class="money">' +
                        Shopify.formatMoney(variant.price, theme.money_format) +
                        "</span></span>"
                    );
                    $(".js-product-" + productId + " .js-product-price-compare").html(
                        '<s class="product-' +
                        sectionClass +
                        '__price-compare"><span class="money">' +
                        Shopify.formatMoney(
                            variant.compare_at_price,
                            theme.money_format
                        ) +
                        "</span></s>"
                    );
                } else {
                    $(".js-product-" + productId + " .js-product-price-number").html(
                        '<span class="product-' +
                        sectionClass +
                        '__price-number"><span class="money">' +
                        Shopify.formatMoney(variant.price, theme.money_format) +
                        "</span></span>"
                    );
                    $(".js-product-" + productId + " .js-product-price-compare").empty();
                }
            }
        } else {
            // variant doesn't exist.
            // Variant unit notificaton hide
            $('.js-product-' + productId + ' .js-price-unit-note').hide();
            // Variant stock notification hide
            $(".js-product-" + productId + " .js-price-stock-note").hide();
            // Price and button
            $(".js-product-" + productId + " .js-product-price-number").html('&nbsp;');
            $(".js-product-" + productId + " .js-product-price-compare").empty();
            $(".js-product-" + productId + " .js-product-add")
                .addClass("disabled")
                .prop("disabled", true)
                .find(".js-product-add-text")
                .text(theme.t.unavailable);
        }

        //slider functions
        var thisSlider = $(".js-product-" + productId + " .js-product-slider");

        function checkSlick(slideToGo) {
            //move slider to variant after slick is init
            var interval = setInterval(function () {
                if (thisSlider.hasClass("slick-initialized")) {
                    thisSlider.slick("slickGoTo", slideToGo);
                    clearInterval(interval);
                }
            }, 100);
        }

        if (variant.featured_image !== null) {
            if (variant.featured_image.variant_ids.length > 0) {
                var mediaId = variant.featured_media.id;
                var slide = $(".js-product-" + productId + " .product-" + sectionClass + "__photo__item[data-media-id*=" + variant.featured_media.id + "]");
                var slideId = slide.attr("data-slide-id");

                checkSlick(slideId);
            } else {
                checkSlick(0);
            }
        }

        document.dispatchEvent(
            new CustomEvent("venue:variant:updated", {
                bubbles: true,
                detail: {product: productObj, variant: variant, cssClass: cssClass}
            })
        );
    };

    //SWATCH functions
    //match swatch to dropdown
    $('.js-product-single-swatch :radio').change(function () {

        var optionIndex = $(this).closest('.js-product-single-swatch').attr('data-option-index');
        var optionValue = $(this).val();

        $(this)
            .closest('form')
            .find('.single-option-selector')
            .eq(optionIndex - 1)
            .val(optionValue)
            .change();

        //update sub title text
        var value = $(this).val();
        var sub_title = $(this).parents('.js-product-single-swatch').find('.js-swatch-variant-title');
        sub_title.text(value);

    });
    //initial color title text
    $('.js-swatch-variant-title').text($('.js-swatch-color-item :radio:checked').val());

    //check if product selected
    if (productObj.onboarding !== true) {
        new Shopify.OptionSelectors("productSelect-" + sectionId, {
            product: productObj,
            onVariantSelected: selectCallback,
            enableHistoryState: historyState
        });

        if (productObj.options.length == 1 && productObj.options[0] != "Title") {
            // Add label if only one product option and it isn't 'Title'. Could be 'Size'.
            $(".js-product-" + productObj.id + " .selector-wrapper:eq(0)").prepend(
                '<label for="productSelect-option-0">' +
                productObj.options[0] +
                "</label>"
            );
        }
        if (
            productObj.variants.length == 1 &&
            productObj.variants[0].title.indexOf("Default") > -1
        ) {
            // Hide selectors if we only have 1 variant and its title contains 'Default'.
            $(".js-product-" + productObj.id + " .selector-wrapper").hide();
            $(".js-product-" + productObj.id + " .swatch").hide();
        }
    }
};

theme.eventFeed = function (apiKey, templateId, anchorId, sectionId) {

    var orgUrl = "https://www.eventbriteapi.com//v3/users/me/organizations/?token=" + apiKey;

    $.getJSON(orgUrl, function (data) {
    }).done(function (data) {

        var orgId = data.organizations[0].id;

        var eventsUrl =
            "https://www.eventbriteapi.com//v3/organizations/" +
            orgId +
            "/events/?token=" +
            apiKey +
            "&expand=venue&status=live";

        $.getJSON(eventsUrl, function (data) {
            var template = $(templateId).html();
            var compile = Handlebars.compile(template)(data);

            //compile and append tempalte with data
            $(anchorId).append(compile);
            //slider dunction
            theme.layoutSlider(".js-layout-slider-" + sectionId);

            //scrollreveal
            if ($("body").data("anim-load")) {
                sr.reveal(".section--" + sectionId + " .section__link", {distance: 0});
                sr.reveal(".section--" + sectionId + " .home-event__item", {
                    interval: theme.intervalValue
                });
            }
        });
        //format time helper
        Handlebars.registerHelper("formatDate", function (date) {
            return fecha.format(new Date(date), "ddd, DD MMM, HH:mm");
        });
        //limit loop helper
        Handlebars.registerHelper("each_upto", function (ary, max, options) {
            if (!ary || ary.length === 0) return options.inverse(this);
            var result = [];
            for (var i = 0; i < max && i < ary.length; ++i)
                result.push(options.fn(ary[i]));
            return result.join("");
        });
    });
};

//home carousel functions & video backgound
theme.homeMainCarousel = function () {
    var carousels = $(".js-home-carousel");
    var currWinWidth = $(window).width();

    var mobileCond = currWinWidth >= 1;

    //slick carousel functions and init
    carousels.each(function () {
        var carousel = $(this);

        carousel.on("init", function (event, slick) {
            //check if this carousel has youtube videos
            if ($(this).find(".js-home-carousel-video--yt").length) {
                if (mobileCond) {
                    var thisCarousel = $(this);
                    //check if youtube API is loaded
                    if (typeof YT === "undefined") {
                        // insert youtube iframe API
                        $.getScript("https://www.youtube.com/iframe_api")
                            //after loaded
                            .done(function () {
                                var interval = setInterval(function () {
                                    //check if YT is function and loop if not
                                    if ($.isFunction(YT.Player)) {
                                        loadVideos(thisCarousel);
                                        clearInterval(interval);
                                    }
                                }, 100);
                            });
                    } else {
                        loadVideos(thisCarousel);
                    }
                }
            }

            //check if this carousel has self hosted videos
            if ($(this).find(".js-home-carousel-video--self").length) {
                // check if self hosted video is first slide and initiate active class
                if ($(this).find("[data-slide-id='0']").find('.js-home-carousel-video--self').length) {
                    var thisSelfVideo = $(this).find("[data-slide-id='0']").find('.js-home-carousel-video--self');
                    setTimeout(function () {
                        thisSelfVideo.addClass("js-loaded");
                    }, 300);
                }
            }

            //content loading classes
            $(this)
                .find(".slick-active")
                .addClass("js-slide-active");
        });

        carousel.on("afterChange", function (event, slick, currentSlide) {
            if (mobileCond) {
                //for youtube

                var currentSlideElement = $(this).find("[data-slide-id='" + currentSlide + "']");

                if (currentSlideElement.find(".js-home-carousel-video--yt").length) {
                    var dataPlayerId = $(this)
                        .find(".slick-active .js-home-carousel-video-data")
                        .attr("data-player-id");

                    if (window[dataPlayerId].B) {
                        //check if element is ready
                        window[dataPlayerId].playVideo();
                    } else {
                        setTimeout(function () {
                            window[dataPlayerId].playVideo();
                        }, 1000);
                    }

                    var thisYTVideo = $(this).find(
                        ".slick-active .js-home-carousel-video"
                    );
                    //ading timeout so video cover waits for youtube to initiate loading
                    setTimeout(function () {
                        thisYTVideo.addClass("js-loaded");
                    }, 800);
                }
                //for self hosted
                if (currentSlideElement.find(".js-home-carousel-video--self").length) {
                    var thisSelfVideo = $(this).find(
                        ".slick-active .js-home-carousel-video"
                    );
                    setTimeout(function () {
                        thisSelfVideo.addClass("js-loaded");
                    }, 300);
                }
            }

            //content loading classes
            $(this)
                .find(".slick-slide")
                .removeClass("js-slide-active");
            $(this)
                .find(".slick-active")
                .addClass("js-slide-active");
        });

        carousel.not(".slick-initialized").slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            dots: true,
            fade: true,
            cssEase: "linear",
            prevArrow:
                '<div class="home-carousel__nav home-carousel__nav--prev"><i class="icon icon--left-t"></i></div>',
            nextArrow:
                '<div class="home-carousel__nav home-carousel__nav--next"><i class="icon icon--right-t"></i></div>'
        });

        //checking for adaptive height when loading for smoother first view
        for (var i = 0; i < 10; i++) {
            setTimeout(function () {
                $('.js-home-carousel').slick('setPosition');
            }, 250 * i);
        }
    });

    function loadVideos(thisCarousel) {
        var players = $(thisCarousel).find(".js-home-carousel-video-data");

        function onReadyVideo(event) {
            event.target.mute();
            theme.videoSize(event.target.f);

            //check if this slide is active and play video if so
            if (
                $(event.target.f)
                    .parents(".slick-slide")
                    .hasClass("slick-active")
            ) {
                event.target.playVideo();
                //ading timeout so video cover waits for youtube to start playing
                setTimeout(function () {
                    $(event.target.f)
                        .parent()
                        .addClass("js-loaded");
                }, 800);
            }
        }

        function onChangeVideo(event) {
            if (event.data === YT.PlayerState.ENDED) {
                //when video ends - repeat
                event.target.playVideo();
            }
        }

        for (var i = 0; i < players.length; i++) {
            window[players[i].getAttribute("data-player-id")] = new YT.Player(
                players[i],
                {
                    videoId: players[i].getAttribute("data-video-id"),
                    playerVars: {
                        iv_load_policy: 3,
                        modestbranding: 1,
                        playsinline: 1,
                        cc_load_policy: 0,
                        fs: 0,
                        autoplay: 1,
                        mute: 1,
                        controls: 0,
                        showinfo: 0,
                        wmode: "opaque",
                        quality: 'hd720',
                        branding: 0,
                        autohide: 0,
                        rel: 0
                    },
                    events: {
                        onReady: onReadyVideo,
                        onStateChange: onChangeVideo
                    }
                }
            );
        }
    }

    //recalcluate all iframe sizes on browser resize
    var videoResizeTimer;
    $(window).resize(function () {
        winWidth = $(window).width();
        clearTimeout(videoResizeTimer);
        videoResizeTimer = setTimeout(function () {
            theme.videoSize($(".js-home-carousel-video-data"));
        }, 500);
    });
};

theme.videoSize = function (video) {
    //set elems
    var iframe = $(video);

    //find video size
    var origHeight = iframe.attr("height");
    var origWidth = iframe.attr("width");

    //find element width and caclulate new height
    var parentHeigt = iframe.parent().height();
    var parentWidth = iframe.parent().width();

    //calc height and width based on original ratio
    var newHeight = (parentWidth / origWidth) * origHeight;
    var newWidth = (parentHeigt / origHeight) * origWidth;

    //check if video ratio fits with carousel container and add css settings
    if (parentHeigt < newHeight) {
        iframe.css({
            width: parentWidth + "px",
            height: newHeight + 120 + "px",
            top: (parentHeigt - newHeight) / 2 - 60 + "px",
            left: 0
        });
    } else {
        iframe.css({
            width: newWidth + "px",
            height: parentHeigt + 120 + "px",
            left: (parentWidth - newWidth) / 2 + "px",
            top: '-60px'
        });
    }
};

//home video gallery
theme.homeVideoGallery = function () {
    function vimeoThumbs() {
        //iteration for all thumbs while waiting for ajax to complete
        var i = 0;

        function next() {
            if (i < $(".js-vimeo-thumb").length) {
                thisThumb = $(".js-vimeo-thumb")[i];
                var vimeoID = $(thisThumb).attr("data-video-id");

                $.ajax({
                    url: "https://vimeo.com/api/v2/video/" + vimeoID + ".json",
                    dataType: "json",
                    complete: function (data) {
                        $(thisThumb).attr(
                            "data-bgset",
                            data.responseJSON[0].thumbnail_medium
                        );

                        i++;
                        next();
                    }
                });
            }
        }

        // kick off the first thumb iteration
        next();

        //placeholder thumb
        if ($(".js-vimeo-placeholder").length > 0) {
            var vimeoID = $(".js-vimeo-placeholder").attr("data-video-id");

            $.ajax({
                url: "https://vimeo.com/api/v2/video/" + vimeoID + ".json",
                dataType: "json",
                success: function (data) {
                    var img = data[0].thumbnail_large;
                    var newImg = img.replace("640", "1280");
                    $(".js-vimeo-placeholder").attr("data-bgset", newImg);
                }
            });
        }
    }

    vimeoThumbs(); //run

    //init player plugin after lazy loaded iframes
    homePlayers = [];
    var lazyVideoGallery = new LazyLoad({
        elements_selector: ".js-home-video-stage",
        callback_set: function (el) {
            //load Plyr library
            theme.LibraryLoader.load(
                'plyr',
                videoPlayersInit
            );
            //load in Shopify Plyr styles
            theme.LibraryLoader.load('plyrShopifyStyles');

            $(el).find('.js-lazy-iframe').each(function (i) {
                $(this).attr("src", $(this).data('src')).removeAttr('data-src');
            });

            function videoPlayersInit() {
                $(el).find('.js-home-video-player').each(function (i) {
                    var videoId = $(this).attr("id");
                    //setup each player with unique var
                    window[videoId] = new Plyr(".js-home-video-player", {
                        controls: [
                            'play',
                            'progress',
                            'mute',
                            'volume',
                            'play-large',
                            'fullscreen'
                        ],
                        loop: {active: false},
                        hideControlsOnPause: true,
                        iconUrl:
                            '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
                        tooltips: {controls: false, seek: true}
                    });

                    //array of all players for mass functions
                    homePlayers.push(window[videoId]);
                });
            }
        }
    });

    //placeholder click
    $(".js-home-video-placeholder-trigger").click(function (e) {
        e.preventDefault();

        var triggerTarget = $(this).attr("href");
        var triggerId = $(this)
            .attr("href")
            .replace(/#/, "");

        //hide placeholder
        $(this)
            .parent(".js-home-video-placeholder")
            .addClass("js-hidden");

        //pause all videos if playing
        homePlayers.forEach(function (instance) {
            instance.pause();
        });

        //start video
        window["home_player_" + triggerId].play();
    });

    //thumbs click
    $(".js-home-video-trigger").click(function (e) {
        e.preventDefault();

        var triggerTarget =
            "#js-home-video-" +
            $(this)
                .attr("href")
                .replace(/#/, "");
        var triggerId = $(this)
            .attr("href")
            .replace(/#/, "");
        var sectionPlaceholder = $(this)
            .parents(".home-video")
            .find(".js-home-video-placeholder");

        //hide placeholder
        sectionPlaceholder.addClass("js-hidden");

        //remove and add active class
        $(this)
            .parents(".home-video")
            .find(".js-home-video")
            .removeClass("js-active");
        $(triggerTarget).addClass("js-active");

        //pause all videos
        homePlayers.forEach(function (instance) {
            instance.pause();
        });

        //pause on second click and play function
        if (
            $(this)
                .parent()
                .hasClass("js-paused")
        ) {
            window["home_player_" + triggerId].play();
            $(this)
                .parent()
                .removeClass("js-paused");
        } else if (
            $(this)
                .parent()
                .hasClass("js-active")
        ) {
            $(this)
                .parent()
                .addClass("js-paused");
        } else {
            window["home_player_" + triggerId].play();
        }

        //set correct thumb to active
        $(".js-home-video-trigger")
            .parent()
            .removeClass("js-active");
        $(".js-home-video-trigger")
            .parent()
            .removeClass("js-init");
        $(this)
            .parent()
            .addClass("js-active");
    });
};

theme.masonryLayout = function () {
    // Masonry layout init
    // Loading images
    $(".o-layout--masonry")
        .imagesLoaded()
        .always(function (instance) {
            $(".o-layout--masonry").masonry({
                itemSelector: ".o-layout__item",
                transitionDuration: 0
            });

            //reset scroll reveal geometry
            if ($("body").data("anim-load")) {
                sr.delegate();
            }
        })
        // Run masonry while loading images
        .progress(function (instance, image) {
            $(".o-layout--masonry").masonry({
                itemSelector: ".o-layout__item",
                transitionDuration: 0
            });

            //reset scroll reveal geometry
            if ($("body").data("anim-load")) {
                sr.delegate();
            }
        });
};

theme.animFade = function () {
    if ($("body").data("anim-fade")) {
        // add class to stop transition to non navigational links
        $(
            'a[href^="#"], a[target="_blank"], a[href^="mailto:"], a[href^="tel:"], a[href*="youtube.com/watch"], a[href*="youtu.be/"]'
        ).each(function () {
            $(this).addClass("js-no-transition");
        });
        //fix for safari and firefox back button issues
        if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/) || !!navigator.userAgent.match(/Firefox\/([0-9]+)\./)) {
            $("a").on("click", function () {
                window.setTimeout(function () {
                    $("body").removeClass("js-theme-unloading");
                }, 1200);
            });
        }

        $(
            "a:not(.js-no-transition, .js-header-sub-link-a, .js-header-sub-t-a)"
        ).bind("click", function (e) {
            if (e.metaKey) return true;
            e.preventDefault();
            //close all popups
            $.magnificPopup.close();
            //add class for unloading
            $("body").addClass("js-theme-unloading");
            //redirect
            var src = $(this).attr("href");
            window.setTimeout(function () {
                location.href = src;
            }, 50);
        });
    }
};

theme.animScroll = function () {
    if ($("body").data("anim-load")) {
        theme.intervalStyle = {};
        if ($("body").data("anim-interval-style") == "fade_down") {
            theme.intervalStyle = "-20px";
        } else if ($("body").data("anim-interval-style") == "fade_up") {
            theme.intervalStyle = "20px";
        } else {
            theme.intervalStyle = "0";
        }

        theme.intervalValue = {};
        if ($("body").data("anim-interval")) {
            theme.intervalValue = 200;
        } else {
            theme.intervalValue = 0;
        }

        var config = {
            viewFactor: 0.1,
            duration: 1000,
            distance: theme.intervalStyle,
            scale: 1,
            delay: 0,
            mobile: true,
            useDelay: "once",
            beforeReveal: function myCallback(el) {
                $(el).addClass("js-sr-loaded");
            }
        };

        window.sr = new ScrollReveal(config);

        //elements
        sr.reveal(".section__title", {distance: "5px"});
        sr.reveal(".section__title-desc", {distance: 0, delay: 300});
        sr.reveal(".newsletter, .section__link, .account", {distance: 0});
        sr.reveal(".product-top, .collection-list__item", {
            interval: theme.intervalValue
        });

        //cart
        sr.reveal(".cart .section__title", {distance: "20px"});
        sr.reveal(".cart__content", {distance: 0, delay: 500});

        //search
        sr.reveal(".search-page .section__title", {distance: "20px"});
        sr.reveal(".search-page__form, .search-page-pagination", {
            distance: 0,
            delay: 200
        });
        sr.reveal(".search-page .product-top, .search-page__other-item", {
            interval: theme.intervalValue,
            delay: 0
        });

        //blog
        sr.reveal(".blog", {delay: 300, interval: theme.intervalValue});
        sr.reveal(".blog-page__tags, .blog-pagination", {
            distance: 0,
            delay: 300
        });
        sr.reveal(".blog-page .section__title", {distance: "20px"});

        //article
        sr.reveal(".article .section__title", {distance: "20px"});
        sr.reveal(".article__date", {distance: "-10px", delay: 500});
        sr.reveal(".article__featured-media, .article__content", {
            distance: 0,
            delay: 200
        });
        sr.reveal(".article__meta, .article-paginate", {distance: 0});

        //collection page
        sr.reveal(".collection__header-info__title", {distance: "20px"});
        sr.reveal(".collection .product-top", {interval: theme.intervalValue});
        sr.reveal(
            ".collection__header-media, .collection__header-info__text, .collection-main__sort, .collection-empty, .collection-pagination",
            {distance: 0, delay: 200}
        );

        //collection list
        sr.reveal(".list-collections .section__title", {distance: "20px"});
        sr.reveal(".list-collections .collection-list__item", {
            interval: theme.intervalValue,
            delay: 500
        });

        //product page
        sr.reveal(".product-single__title-text", {distance: "20px"});
        sr.reveal(
            ".product-single__title-desc, .breadcrumb, .product-single__photos, .product-single__content, .product-single--minimal .product-single__content-text",
            {distance: 0, delay: 300, useDelay: "onload"}
        );

        //page
        sr.reveal(".page .section__title", {distance: "20px"});
        sr.reveal(".faq__cta", {distance: 0, delay: 300});
        sr.reveal(".faq__search", {distance: 0, delay: 300});
        sr.reveal(".faq__accordion", {distance: 0, delay: 500});
        sr.reveal(".faq__category__title", {distance: 0});
        sr.reveal(".page__contact-form", {distance: 0, delay: 200});

        //sections
        sr.reveal(".home-carousel .section__title", {distance: 0});
        sr.reveal(".home-image-grid__item", {interval: theme.intervalValue});
        sr.reveal(".home-promo__box");
        sr.reveal(".home-intro", {distance: 0});
        sr.reveal(
            ".home-intro__media, .home-intro__text, .home-intro__video, .home-intro__link-wrap"
        );
        sr.reveal(".home-logo-list__items", {distance: 0});
        sr.reveal(".home-testimonials", {distance: 0});

        sr.reveal(".product-featured__photo-wrapper", {distance: 0, delay: 500});
        sr.reveal(".home-event__item", {interval: theme.intervalValue}); //aslo in eventFeed secion for ajax
        sr.reveal(".home-delivery", {distance: 0});
        sr.reveal(".home-delivery__content", {distance: theme.intervalStyle});
        sr.reveal(".home-map__items");
        sr.reveal(".home-rich-text__content", {distance: 0, delay: 500});
        sr.reveal(".home-inline__item", {interval: theme.intervalValue});
        sr.reveal(".home-video__stage, .home-video__items", {distance: 0});
        sr.reveal(".home-custom__item", {interval: theme.intervalValue});
        sr.reveal(".home-html", {distance: 0});
    }
};

theme.thumbsCarousel = function () {
    $(".js-section__product-single .js-product-slider").not(".slick-initialized").each(function () {
        $(this).slick({
            focusOnSelect: true,
            accessibility: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: false,
            arrows: true,
            dots: true,
            swipe: true,
            fade: true,
            adaptiveHeight: true,
            speed: 300,
            cssEase: "ease",
            lazyLoad: "progressive",
            prevArrow:
                '<div class="product-single__photo__nav__item product-single__photo__nav__item--prev"><i class="icon icon--left-l"></i></div>',
            nextArrow:
                '<div class="product-single__photo__nav__item product-single__photo__nav__item--next"><i class="icon icon--right-l"></i></div>',
            customPaging: function (slider, i) {
                return (
                    '<button><div class="product-single__photo-thumbs__item">' +
                    $(".js-product-single-thumbs div:nth-child(" + (i + 1) + ")").html() +
                    "</div></button>"
                );
            },
            appendDots: $(this).parent().find('.js-product-slider-nav-dots'),
            responsive: [{
                breakpoint: 768,
                settings: {
                    appendArrows: $(this).parent().find('.js-product-slider-nav')
                }
            }]
        })
            //calc height for single product classic view slideshow
            .on("setPosition", function (event, slick) {
                if ($(".product-single").hasClass("product-single--classic")) {
                    if ($(".js-product-bg").hasClass("js-product-bg--full")) {
                        heightFraction = 1;
                    } else {
                        heightFraction = 0.55;
                    }

                    var photoHeight = $(".js-product-slider")
                        .find(".slick-list")
                        .height();

                    var thumbsHeight = 0;
                    if ($(".js-product-slider-nav").find(".slick-dots").length) {
                        thumbsHeight = $(".js-product-slider-nav")
                            .find(".slick-dots")
                            .outerHeight(true);
                    }

                    var breadcrumbHeight = 0;
                    if ($('.js-breadcrumb').length) {
                        breadcrumbHeight = $('.js-breadcrumb').outerHeight(true);
                    }

                    var viewInSpaceBtnHeight = 0;
                    if ($('.js-product-view-in-space-btn').length > 0 && !$('.js-product-view-in-space-btn').is('[data-shopify-xr-hidden]')) {
                        viewInSpaceBtnHeight = $(".js-product-view-in-space-btn").outerHeight(true);
                    }

                    $(".js-product-bg").css(
                        "height",
                        photoHeight *
                        heightFraction +
                        thumbsHeight +
                        breadcrumbHeight +
                        viewInSpaceBtnHeight +
                        60 +
                        "px"
                    );
                }
            });
    });
    //checking for adaptive height when loading for smoother first view
    for (var i = 0; i < 15; i++) {
        setTimeout(function () {
            $('.js-product-slider').slick('setPosition');
        }, 250 * i);
    }
};

theme.logoCarousel = function () {
    function logoCarouselInitFull(carousel) {
        carousel.not(".slick-initialized").slick({
            slidesToShow: slideCount,
            slidesToScroll: slideCount,
            arrows: true,
            dots: true,
            fade: false,
            adaptiveHeight: false,
            speed: 300,
            cssEase: "ease",
            lazyLoad: "progressive",
            prevArrow:
                '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--prev"><i class="icon icon--left-l"></i></div>',
            nextArrow:
                '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--next"><i class="icon icon--right-l"></i></div>',
            responsive: [
                {
                    breakpoint: theme.mobileBrkp,
                    settings: {
                        swipeToSlide: true,
                        variableWidth: true,
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });
    }

    function logoCarouselInitDesk(carousel) {
        carousel.not(".slick-initialized").slick({
            slidesToShow: slideCount,
            slidesToScroll: slideCount,
            arrows: true,
            dots: true,
            fade: false,
            adaptiveHeight: false,
            speed: 300,
            cssEase: "ease",
            lazyLoad: "progressive",
            prevArrow:
                '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--prev"><i class="icon icon--left-l"></i></div>',
            nextArrow:
                '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--next"><i class="icon icon--right-l"></i></div>'
        });
    }

    function logoCarouselInitMobile(carousel) {
        carousel.not(".slick-initialized").slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            swipeToSlide: true,
            variableWidth: true,
            arrows: false,
            dots: true,
            fade: false,
            adaptiveHeight: false,
            speed: 300,
            cssEase: "ease",
            lazyLoad: "progressive"
        });
    }

    $(window)
        .resize(function () {
            //get sizes
            winWidth = $(window).width();

            var carousels = $(".js-home-logo-list-carousel");

            //slick carousel functions and init
            carousels.each(function () {
                carousel = $(this);

                slideCount = carousel.data("carouselCount");

                desktop = carousel.data("carouselDesktop");
                mobile = carousel.data("carouselMobile");

                if (desktop && mobile) {
                    logoCarouselInitFull(carousel, slideCount);
                } else if (desktop) {
                    if (winWidth >= theme.mobileBrkp) {
                        logoCarouselInitDesk(carousel, slideCount);
                    } else {
                        //check if slick is initiated
                        if (carousel.hasClass("slick-initialized")) {
                            //detach slick
                            carousel.slick("unslick");
                        }
                    }
                } else if (mobile) {
                    if (winWidth < theme.mobileBrkp) {
                        logoCarouselInitMobile(carousel, slideCount);
                    } else {
                        //check if slick is initiated
                        if (carousel.hasClass("slick-initialized")) {
                            //detach slick
                            carousel.slick("unslick");
                        }
                    }
                }
            });
        })
        .resize();
};

theme.testimonialsCarousel = function () {
    function testimonialsCarouselInit(carousel) {
        carousel.not(".slick-initialized").slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            dots: true,
            fade: false,
            adaptiveHeight: false,
            speed: 300,
            cssEase: "ease",
            lazyLoad: "progressive",
            prevArrow:
                '<div class="home-testimonials-carousel__nav home-testimonials-carousel__nav--prev"><i class="icon icon--left-l"></i></div>',
            nextArrow:
                '<div class="home-testimonials-carousel__nav home-testimonials-carousel__nav--next"><i class="icon icon--right-l"></i></div>'
        });
    }

    $(window)
        .resize(function () {
            //get sizes
            winWidth = $(window).width();

            var carousels = $(".js-home-testimonials-carousel");

            //slick carousel functions and init
            carousels.each(function () {
                carousel = $(this);

                desktop = carousel.data("carouselDesktop");
                mobile = carousel.data("carouselMobile");

                if (desktop && mobile) {
                    testimonialsCarouselInit(carousel);
                } else if (desktop) {
                    if (winWidth >= theme.mobileBrkp) {
                        testimonialsCarouselInit(carousel);
                    } else {
                        //check if slick is initiated
                        if (carousel.hasClass("slick-initialized")) {
                            //detach slick
                            carousel.slick("unslick");
                        }
                    }
                } else if (mobile) {
                    if (winWidth < theme.mobileBrkp) {
                        testimonialsCarouselInit(carousel);
                    } else {
                        //check if slick is initiated
                        if (carousel.hasClass("slick-initialized")) {
                            //detach slick
                            carousel.slick("unslick");
                        }
                    }
                }
            });
        })
        .resize();
};

theme.headerScrollUp = function () {
    function hasScrolled() {
        var st = $(this).scrollTop();

        // Make sure to scroll more than delta
        if (Math.abs(lastScrollTop - st) <= delta)
            return;

        // If scrolled down and are past the navbar, add class .nav-up.
        // This is necessary so you never see what is "behind" the navbar.
        if (st > lastScrollTop && st > navbarHeight) {// Scroll Down
            $(body).removeClass('header-down').addClass('header-up');
        } else {// Scroll Up
            $(body).removeClass('header-up').addClass('header-down');
        }
        lastScrollTop = st;
    }

    if ($(".js-header").hasClass("js-header-scroll")) {
        // Hide Header on on scroll down
        var didScroll;
        var lastScrollTop = 0;
        var delta = 5;
        var navbarHeight = $('.js-header').outerHeight() + 50;

        $(window).scroll(function (event) {
            didScroll = true;
        });

        setInterval(function () {
            if ($(".js-header").hasClass("js-header-scroll")) {
                if (didScroll) {
                    hasScrolled();
                    didScroll = false;
                }
            }
        }, 250);
    }
};

theme.accordion = function () {
    var item = $(".js-accordion-info");
    var trigger = $(".js-accordion-trigger");
    var items = item.hide(); //hide all items
    var activeClass = "js-active";

    trigger.click(function () {
        var thisItem = $(this).attr("href");

        //recalculate single product fixed box position on accordion changes
        //added delay to wait for accordion to finish animating
        setTimeout(function () {
            $(".js-product-single-box").trigger("resize");
        }, 400);

        //review stars scroll and open
        if ($(this).hasClass("js-accordion-scroll")) {
            var outsideAccordion = $(".js-accordion").find(
                "[href='" + $(this).attr("href") + "']"
            );

            //check if sticky header and set correct offset
            if ($(".js-header").hasClass("js-header-sticky")) {
                scrollOffset = $(".js-header").outerHeight() + 18;
            } else {
                scrollOffset = 18;
            }

            //scroll
            $("html,body").animate(
                {
                    scrollTop: outsideAccordion.offset().top - scrollOffset
                },
                800
            );

            //open accordion
            $(thisItem)
                .addClass(activeClass)
                .stop()
                .slideDown();
            outsideAccordion.addClass(activeClass);

            return false;
        }

        //check if clicked is active
        if ($(thisItem).hasClass(activeClass)) {
            //close current item
            $(this).removeClass(activeClass);
            $(thisItem)
                .removeClass(activeClass)
                .stop()
                .slideUp();
        } else {
            //open and activate this item
            $(thisItem)
                .addClass(activeClass)
                .stop()
                .slideDown();
            $(this).addClass(activeClass);
        }

        return false;
    });

    //FAQ page autocomplete with accordion scroll
    if (typeof faq_items != "undefined") {
        $(".js-faq-autocomplete").autocomplete({
            lookup: faq_items,
            lookupFilter: function (suggestion, query, queryLowerCase) {
                var content = suggestion.content.toLowerCase(),
                    value = suggestion.value.toLowerCase();

                return (
                    content.indexOf(queryLowerCase) > -1 ||
                    value.indexOf(queryLowerCase) > -1
                );
            },
            onSelect: function (suggestion) {
                //check if sticky header and set correct offset
                if ($(".js-header").hasClass("js-header-sticky")) {
                    scrollOffset = $(".js-header").outerHeight() + 18;
                } else {
                    scrollOffset = 18;
                }

                //scroll
                $("html,body").animate(
                    {
                        scrollTop:
                            $(".js-accordion")
                                .find("[href='#" + suggestion.data + "']")
                                .offset().top - scrollOffset
                    },
                    800
                );

                setTimeout(function () {
                    //open accordion
                    $("#" + suggestion.data)
                        .addClass(activeClass)
                        .stop()
                        .slideDown();
                    $(".js-accordion")
                        .find("[href='#" + suggestion.data + "']")
                        .addClass(activeClass);
                }, 800);

                $(this).val('');
            }
        });
        //disable browser autocomplete
        $(".js-faq-autocomplete").disableAutoFill();
    }
};

//animated scroll to div ID
theme.scrollToDiv = function () {
    $(".js-scroll-id").click(function (e) {
        var thisId = $(this).attr("href");

        //check for the offset
        if ($(".js-header").hasClass("js-header-sticky")) {
            scrollOffset = $(".js-header").outerHeight() + 18;
        } else {
            scrollOffset = 18;
        }

        //scroll
        $("html,body").animate(
            {
                scrollTop: $(thisId).offset().top - scrollOffset
            },
            800
        );

        return false;
    });
};

//localize popup toggle
theme.localizeToggle = function () {
    var box = $(".js-localize-box");
    var trigger = $(".js-localize-trigger");
    var item = $(".js-localize-item");
    var activeClass = "js-active";

    item.click(function () {
        var value = $(this).data('value');

        $(this).parents('.js-localize-wrapper').find("[data-disclosure-input]").val(value);
        $(this).parents('form').submit();

        return false;
    });

    trigger.click(function () {

        var thisTarget = $(this).parents('.js-localize-wrapper').find(box);

        if ($(this).hasClass(activeClass)) {
            $(this).removeClass(activeClass).attr("aria-expanded", "false");
            $(thisTarget).removeClass(activeClass);
        } else {
            box.removeClass(activeClass);
            trigger.removeClass(activeClass).attr("aria-expanded", "false");

            $(thisTarget).addClass(activeClass);
            $(this).addClass(activeClass).attr("aria-expanded", "true");
        }

        return false;
    });

    //basic accessibility for keyboard
    box
        .focusin(function () {
            $(this).addClass(activeClass);
            $(this).parents('.js-localize-wrapper').find(trigger).addClass(activeClass).attr("aria-expanded", "true");
        })
        .focusout(function () {
            $(this).removeClass(activeClass);
            $(this).parents('.js-localize-wrapper').find(trigger).removeClass(activeClass).attr("aria-expanded", "false");
        });

    //click outside elem to hide functions
    $(document).click(function (e) {
        if (!box.is(e.target) && box.has(e.target).length === 0) {
            box.removeClass(activeClass);
            trigger.removeClass(activeClass).attr("aria-expanded", "false");
        }
    });
};

//header nav functions
theme.headerNav = function () {
    var link = $(".js-header-sub-link");
    var tLink = $(".js-header-sub-t-link");
    var linkA = $(".js-header-sub-link-a");
    var tLinkA = $(".js-header-sub-t-a");
    var activeClass = "js-active";

    var headerNavs = $(".js-heaver-navs");
    var mobileDraw = $(".js-mobile-draw-icon");
    var searchDraw = $(".js-search-draw-icon");
    var cartDraw = $(".js-cart-draw-icon");
    var primaryNav = $(".js-primary-nav");
    var secondaryNav = $(".js-secondary-nav");
    var logoImg = $(".js-main-logo");

    //nav accessibility for keyboard
    link
        .focusin(function () {
            $(this).addClass(activeClass);
            $(this).find(linkA).attr("aria-expanded", "true");
        })
        .focusout(function () {
            link.removeClass(activeClass);
            $(this).find(linkA).attr("aria-expanded", "false");
        })
        .click(function () {
            link.removeClass(activeClass);
            $(this).find(linkA).attr("aria-expanded", "true");
        })
    tLink.focusin(function () {
        tLink.removeClass(activeClass);
        tLinkA.attr("aria-expanded", "false");
        $(this).addClass(activeClass);
        $(this).find(tLinkA).attr("aria-expanded", "true");
    });
    link.mouseout(function () {
        $(this).removeClass(activeClass);
    });
    tLink.mouseout(function () {
        $(this).removeClass(activeClass);
    });

    //disable parent links
    $(".header--parent-disabled .js-header-sub-link-a, .header--parent-disabled .js-header-sub-t-a").click(function (e) {
        e.preventDefault();
    });

    //responsive events
    $(window)
        .resize(function () {
            //get sizes
            winWidth = $(window).width();
            var navsWidth = headerNavs.width();
            var primaryWidth = primaryNav.width();
            var secondaryWidth = secondaryNav.width();
            var logoWidth = logoImg.width();
            //calculate available space for primary nav
            var navSpace = navsWidth / 2 - logoImg.width() / 2;
            if (winWidth >= theme.mobileBrkp) {
                if (!$(".js-header").hasClass("header--center")) {
                    if (navSpace < primaryWidth || navSpace < secondaryWidth) {
                        $(".js-header").removeClass('header--inline-icons');
                        mobileDraw.show();
                        searchDraw.show();
                        cartDraw.show();
                        primaryNav.hide();
                        secondaryNav.hide();
                    } else {
                        mobileDraw.hide();
                        searchDraw.hide();
                        cartDraw.hide();
                        primaryNav.show();
                        secondaryNav.show();
                    }
                } else {
                    $(".js-header").removeClass('header--inline-icons');
                    mobileDraw.hide();
                    searchDraw.hide();
                    cartDraw.hide();
                }
            } else {
                mobileDraw.show();
                searchDraw.show();
                cartDraw.show();
            }
        })
        .resize();

    //caculate if third sub nav should appear on right ON MOUSEOVER
    tLink.on("mouseover focusin", function () {
        var subNavT = $(this).find(".js-nav-sub-t");
        //calc sub nav offset compared to window width
        var ofsNo = winWidth - (subNavT.offset().left + subNavT.width());
        //place subnav
        if (ofsNo < 1) {
            subNavT.css("right", "179px");
            subNavT.css("left", "auto");
        }
    });
};

//home single product carousel
theme.homeFeaturedProduct = function () {
    $(".js-section__home-product .js-product-slider").not(".slick-initialized").each(function () {
        $(this).slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            accessibility: true,
            arrows: true,
            dots: true,
            fade: true,
            adaptiveHeight: true,
            infinite: false,
            swipe: true,
            speed: 300,
            cssEase: "ease",
            prevArrow: '<div class="product-featured__photo__nav__item product-featured__photo__nav__item--prev"><i class="icon icon--left"></i></div>',
            nextArrow: '<div class="product-featured__photo__nav__item product-featured__photo__nav__item--next"><i class="icon icon--right"></i></div>',
            appendDots: $(this).parent().find('.js-product-slider-nav-dots'),
            appendArrows: $(this).parent().find('.js-product-slider-nav')
        });
    });
};

//toggle active class on traget div
theme.triggerActive = function () {
    var $target = $(".js-toggle-target");
    var trigger = $(".js-toggle-trigger");
    var activeClass = "js-active";

    trigger.click(function (e) {
        var thisTarget = $(this).attr("href");
        if ($(this).hasClass(activeClass)) {
            $(this).removeClass(activeClass);
            $(thisTarget).removeClass(activeClass);
            //accessibility
            $(this)
                .parent()
                .attr("aria-expanded", "false");
        } else {
            $(this).addClass(activeClass);
            $(thisTarget).addClass(activeClass);
            //accessibility
            $(this)
                .parent()
                .attr("aria-expanded", "true");
        }
        e.preventDefault();
    });
};

//select dropdown styling
theme.selectWrapper = function () {
    //add to each select so label can sit next to it
    //no js-... classes this time
    function setWidth() {
        $(".selector-wrapper").each(function (i) {
            var labelWidth = $(this)
                .find("label")
                .width();
            $(this)
                .find("select")
                .css("padding-left", 20 + labelWidth);
        });
    }

    setWidth();
    setTimeout(setWidth, 500);//repeat
    setTimeout(setWidth, 2000);//repeat
};

//check if two sections in row have backgrounds and if so collapse margin
theme.homeSectionMargin = function () {
    $(".shopify-section").each(function () {
        var thisSection = $(this).find(".section");

        //remove style attr for theme editor to display correctly without refresh
        thisSection.removeAttr("style");
        if (
            thisSection.hasClass("section--has-bg") &&
            $(this)
                .next()
                .find(".section")
                .is(".section--full-bg.section--has-bg")
        ) {
            thisSection.css("margin-bottom", "0");
        }
    });
};

//age checker popup
theme.ageCheckerCookie = function () {
    var ageCookie = "age-checked";

    if ($(".js-age-draw").data("age-check-enabled")) {
        if (typeof Cookies != "undefined") {
            if (Cookies(ageCookie) !== "1") {
                theme.mfpOpen("age");
            }
        }
    }

    $(".js-age-close").click(function (e) {
        Cookies(ageCookie, "1", {expires: 14, path: "/"});
        $.magnificPopup.close();

        e.preventDefault();
    });
};
//promo popup
theme.promoPopCookie = function () {
    var promoCookie = "promo-showed";
    var promoDelay = $(".js-promo-pop").data("promo-delay");
    var promoExpiry = $(".js-promo-pop").data("promo-expiry");

    if ($(".js-promo-pop").data("promo-enabled")) {
        if (typeof Cookies != "undefined") {
            if (Cookies(promoCookie) !== "1") {
                setTimeout(function () {
                    theme.promoPop("open");
                }, promoDelay);
            }
        }
    }

    $(".js-promo-pop-close").click(function (e) {
        Cookies(promoCookie, "1", {expires: promoExpiry, path: "/"});
        theme.promoPop("close");

        e.preventDefault();
    });
};

theme.footerTweet = function () {
    //set vars
    var twtEnable = $(".js-footer-tweet").data("footer-tweet-enable");

    if (twtEnable) {
        var twtUsername = $(".js-footer-tweet")
            .data("footer-tweet-user")
            .substring(1);

        //load twitter widgets JS
        window.twttr = (function (d, s, id) {
            var js,
                fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function (f) {
                t._e.push(f);
            };

            return t;
        })(document, "script", "twitter-wjs");

        //load feed
        twttr.ready(function () {
            twttr.widgets
                .createTimeline(
                    {
                        sourceType: "profile",
                        screenName: twtUsername
                    },
                    document.getElementById("footer-tweet"),
                    {
                        tweetLimit: 1
                    }
                )
                .then(function (data) {
                    //get tweet and ass
                    var tweetText = $(data)
                        .contents()
                        .find(".timeline-Tweet-text")
                        .html();
                    $(".js-footer-tweet-text").html(tweetText);
                });
        });
    }
};

//magnific popup functions
theme.mfpOpen = function (popup) {
    var closeBtn =
        '<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp"><i class="icon icon--close"></i></button>';

    switch (popup) {
        case "cart":
            if (theme.cart_ajax) {
                if (theme.cart_type == "modal") {
                    $.magnificPopup.open({
                        items: {
                            src: ".js-cart-draw"
                        },
                        type: "inline",
                        mainClass: "mfp-medium",
                        fixedContentPos: true,
                        midClick: true,
                        closeMarkup: closeBtn,
                        removalDelay: 200
                    });
                } else {
                    $.magnificPopup.open({
                        items: {
                            src: ".js-cart-draw"
                        },
                        type: "inline",
                        alignTop: true,
                        mainClass: "mfp-notification",
                        fixedContentPos: false,
                        midClick: true,
                        closeMarkup: closeBtn,
                        removalDelay: 200,
                        closeOnBgClick: false,
                        callbacks: {
                            open: function (item) {
                                var thisPopup = $.magnificPopup.instance;
                                //automatic close
                                setTimeout(function () {
                                    if (thisPopup.isOpen) {
                                        thisPopup.close();
                                    }
                                }, 4000);
                            }
                        }
                    });
                }
            }
            break;

        case "search":
            $.magnificPopup.open({
                items: {
                    src: ".js-search-draw"
                },
                type: "inline",
                mainClass: "mfp-medium",
                fixedContentPos: true,
                focus: ".js-search-input",
                closeMarkup: closeBtn,
                removalDelay: 200
            });
            break;

        case "age":
            $.magnificPopup.open({
                items: {
                    src: ".js-age-draw"
                },
                type: "inline",
                mainClass: "mfp-dark",
                fixedContentPos: true,
                modal: true,
                showCloseBtn: false,
                removalDelay: 200
            });
            break;

        case "menu-draw":
            $.magnificPopup.open({
                items: {
                    src: ".js-menu-draw"
                },
                type: "inline",
                mainClass: "mfp-draw",
                fixedContentPos: true,
                closeMarkup: closeBtn,
                removalDelay: 200
            });
            break;

        case "collection-draw":
            $.magnificPopup.open({
                items: {
                    src: ".js-collection-draw"
                },
                callbacks: {
                    resize: function () {
                        if ($('.js-collection-draw').hasClass('collection-sidebar--sidebar') && winWidth >= theme.tabletBrkp) {
                            $.magnificPopup.close();
                        }
                    }
                },
                type: "inline",
                mainClass: "mfp-draw",
                fixedContentPos: true,
                closeMarkup: closeBtn,
                removalDelay: 200
            });
            break;
    }
};

theme.collectionSort = function () {
    Shopify.queryParams = {};
    if (location.search.length) {
        for (
            var aKeyValue, i = 0, aCouples = location.search.substr(1).split("&");
            i < aCouples.length;
            i++
        ) {
            aKeyValue = aCouples[i].split("=");
            if (aKeyValue.length > 1) {
                Shopify.queryParams[
                    decodeURIComponent(aKeyValue[0])
                    ] = decodeURIComponent(aKeyValue[1]);
            }
        }
    }

    var defaultSort = $(".js-collection-sort").data("default-sort");
    $("#SortBy")
        .val(defaultSort)
        .bind("change", function () {
            Shopify.queryParams.sort_by = jQuery(this).val();
            location.search = jQuery.param(Shopify.queryParams);
        });
};

theme.collectionTagFilter = function () {
    var tagGroupLink = $('.js-collection-group-link');

    tagGroupLink.on('click', function (e) {
        var tag = $(this).parent();
        var tagCategory = tag.data('category-group');
        var tagUrl = tag.data('tag-url');
        var activeTag = $('.js-active[data-category-group="' + tagCategory + '"]');

        if (!tag.hasClass('js-active') && activeTag.length > 0) {

            e.preventDefault();
            var newPath = window.location.pathname
                .replace(activeTag.data('tag-url'), tagUrl)
                .replace(/(&page=\d+)|(page=\d+&)|(\?page=\d+$)/, '');
            window.location.pathname = newPath;

        }
    });
};

theme.magnificVideo = function () {
    $(".js-pop-video").magnificPopup({
        type: "iframe",
        mainClass: "mfp-medium mfp-close-corner",
        removalDelay: 200,
        closeMarkup:
            '<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp"><i class="icon icon--close"></i></button>'
    });
};

theme.productZoom = function () {
    var openPhotoSwipe = function (thisBtn, thisImageCount) {
        var pswpElement = document.querySelectorAll('.pswp')[0];
        var productGallery = $('.js-product-slider');

        // build gallery array
        var galleryItems = [];
        $('.js-pswp-img').each(function () {
            var smallSrc = $(this).prop('currentSrc') || $(this).prop('src');
            var item = {
                msrc: smallSrc,
                src: $(this).data('pswp-src'),
                w: $(this).data('pswp-width'),
                h: $(this).data('pswp-height'),
                mediaId: $(this).data('media-id'),
                el: $(this)[0]
            };
            galleryItems.push(item);
        });

        var options = {
            history: false,
            index: thisImageCount,
            closeOnScroll: false,
            getThumbBoundsFn: function () {
                var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                var thumbnail = galleryItems[thisImageCount].el;
                var rect = thumbnail.getBoundingClientRect();
                return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
            }
        };

        var pswpGallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, galleryItems, options);
        pswpGallery.init();
        pswpGallery.listen('close', function () {
            var thisSlideItem = $('.product-single__photo__item[data-media-id=' + this.currItem.mediaId + ']');
            productGallery.slick('slickGoTo', thisSlideItem[0].dataset.slideId);
        });
    };

    $(document).on('click', '.js-pswp-zoom', function () {
        var thisBtn = $(this);
        var thisImageCount = $(this).data('image-count');
        openPhotoSwipe(thisBtn, thisImageCount);
    });

};

theme.promoPop = function (action) {
    var popup = $(".js-promo-pop");
    var activeClass = "js-active";

    if (action == "open") {
        popup.addClass(activeClass);
    } else if (action == "close") {
        popup.removeClass(activeClass);
    }
};

theme.cartCheckbox = function () {
    $(document).on('click', '.js-cart-checkout-validate', function () {
        if ($('.js-cart-terms-input').is(':checked')) {
            $(this).submit();
        } else {
            var errorBox = $(this).parents('form').find('.js-cart-terms-error');
            errorBox.addClass('js-active');
            return false;
        }
    });
    $(document).on('change', '.js-cart-terms-input', function () {
        $('.js-cart-terms-error').removeClass('js-active');
    });
};

//funcitions to initiate ajax cart for the first time
theme.runAjaxCart = function () {
    theme.ajaxCartInit();
    ajaxCart.load();
};

//product page recommendations
theme.productRecommendations = function () {
    // Look for an element with class 'js-product-recommendations'
    var productRecommendationsSection = document.querySelector('.js-product-recommendations');
    if (productRecommendationsSection === null) {
        return;
    }
    // Read product id from data attribute
    var productId = productRecommendationsSection.dataset.productId;
    // Read limit from data attribute
    var limit = productRecommendationsSection.dataset.limit;
    // Build request URL
    var requestUrl = productRecommendationsSection.dataset.baseUrl + '?section_id=product-recommendations&limit=' + limit + '&product_id=' + productId;
    // Create request and submit it using Ajax
    var request = new XMLHttpRequest();
    request.open('GET', requestUrl);
    request.onload = function () {
        if (request.status >= 200 && request.status < 300) {
            var container = document.createElement('div');
            container.innerHTML = request.response;
            productRecommendationsSection.parentElement.innerHTML = container.querySelector('.js-product-recommendations').innerHTML;

            //run ajax cart functions
            theme.runAjaxCart();

            //product swatches
            theme.productCollSwatch();

            //mobile carousel
            $(".js-related-products").each(function (i) {
                var thisSectionId = $(this).data("section-id");
                theme.layoutSlider(".js-layout-slider-" + thisSectionId);
            });

            //reset scrolling animations
            //delaying so the animation doesn't interfere with the main SR function
            if ($("body").data("anim-load")) {
                setTimeout(function () {
                    sr.reveal('.section--related-products .product-top', {interval: theme.intervalValue});
                    sr.reveal('.section--related-products .section__title', {distance: "5px"});
                }, 1000);
            }
        }
    };
    request.send();
};

$(document).ready(function () {
    //Open AJAX cart after new item is added
    $("body").on("afterAddItem.ajaxCart", function () {
        setTimeout(function () {
            theme.mfpOpen("cart");
        }, 100);
    });

    //wait for TAB to be clicked and add class for outline accessible class
    function tabClick(e) {
        if (e.keyCode === 9) {
            body.addClass('js-using-tab');
            window.removeEventListener('keydown', tabClick);
        }
    }

    window.addEventListener('keydown', tabClick);

    //home events get feed
    $(".js-events").each(function (i) {
        var thisSectionId = $(this).data("section-id");
        var thisApiKey = $(this).data("api-key");
        theme.eventFeed(
            thisApiKey,
            "#eventTemplate" + thisSectionId,
            "#eventContainer" + thisSectionId,
            thisSectionId
        );
    });
    //mobile sliders
    $(".js-events-onboarding").each(function (i) {
        var thisSectionId = $(this).data("section-id");
        theme.layoutSlider(".js-layout-slider-" + thisSectionId);
    });
    $(".js-home-collection-list").each(function (i) {
        var thisSectionId = $(this).data("section-id");
        theme.layoutSlider(".js-layout-slider-" + thisSectionId);
    });
    $(".js-home-products").each(function (i) {
        var thisSectionId = $(this).data("section-id");
        theme.layoutSlider(".js-layout-slider-" + thisSectionId);
    });
    $(".js-page-products").each(function (i) {
        var thisSectionId = $(this).data("section-id");
        theme.layoutSlider(".js-layout-slider-" + thisSectionId);
    });
    $(".js-home-testimonials").each(function (i) {
        var thisSectionId = $(this).data("section-id");
        theme.layoutSlider(".js-layout-slider-" + thisSectionId);
    });

    //fitvids
    $(".video-wrapper").fitVids();
    //rich text fitvids
    $('.rte iframe[src*="youtube"]')
        .parent()
        .fitVids();
    $('.rte iframe[src*="vimeo"]')
        .parent()
        .fitVids();

    //rich text table overflow
    $(".rte table").wrap(
        "<div style='overflow:auto;-webkit-overflow-scrolling:touch'></div>"
    );

    //move maps inside tab on mobile
    $(".js-map-replace").appendAround();
    //move cart box for classic layout
    $(".js-cart-replace").appendAround();

    //search popup trigger click
    $(document).on("click", ".js-search-trigger", function (e) {
        theme.mfpOpen("search");
        e.preventDefault();
    });
    //cart popup trigger click
    if (theme.cart_ajax) {
        $(document).on("click", ".js-cart-trigger", function (e) {
            e.preventDefault();
            theme.mfpOpen("cart");
        });
    }
    //mobile menu drawer trigger click
    $(document).on("click", ".js-mobile-draw-trigger", function (e) {
        theme.mfpOpen("menu-draw");
        e.preventDefault();
    });

    //collection sidebar drawer trigger click
    $(document).on("click", ".js-collection-draw-trigger", function (e) {
        theme.mfpOpen("collection-draw");
        e.preventDefault();
    });

    //magnific js close link
    $(document).on("click", ".js-close-mfp", function (e) {
        $.magnificPopup.close();
        e.preventDefault();
    });

    //fixing lazyload image masonry layout
    $(document).on("lazybeforeunveil", function () {
        theme.masonryLayout();
    });

    //recalculating imagelazy sizes after few seconds and after scroll reveal for product
    function checkLazySize() {
        lazySizes.autoSizer.checkElems();
    }

    setTimeout(checkLazySize(), 2000);
    setTimeout(checkLazySize(), 4000);

    //general
    //check if recommended products are not present and init cart
    //checking to avoid double cart initiation
    if (document.querySelector('.js-product-recommendations') === null) {
        theme.runAjaxCart();
    }

    theme.headerScrollUp();
    if ($('.js-header').hasClass('js-header-sticky')) {
        stickybits(".js-section__header", {useStickyClasses: true});
    }

    theme.productRecommendations();
    theme.masonryLayout();
    theme.selectWrapper();
    theme.triggerActive();
    theme.headerNav();
    theme.localizeToggle();
    theme.magnificVideo();
    theme.ageCheckerCookie();
    theme.promoPopCookie();
    theme.footerTweet();
    theme.scrollToDiv();
    theme.animFade();
    theme.animScroll();
    theme.productCollSwatch();
    theme.cartCheckbox();

    //homepage
    theme.homeMaps();
    theme.homeVideoGallery();
    theme.homeMainCarousel();
    theme.homeProductMediaInit();
    theme.homeFeaturedProduct();
    theme.homeSectionMargin();
    theme.testimonialsCarousel();
    theme.logoCarousel();

    //collection
    theme.collectionSort();
    theme.collectionTagFilter();

    //product single
    theme.productMediaInit();
    theme.thumbsCarousel();
    theme.accordion();
    theme.productZoom();
});

// Shopify functions
//
//

// Theme Editor
$(document)
    .on("shopify:section:load", function (event) {
        var section = $(event.target);
        var type = section
            .attr("class")
            .replace("shopify-section", "")
            .trim();
        var id = event.originalEvent.detail.sectionId;
        var sectionId = ".section--" + id;

        theme.homeSectionMargin();
        if ($("body").data("anim-load")) {
            sr.reveal(sectionId + " .section__title", {distance: "5px"});
            sr.reveal(sectionId + " .section__title-desc", {
                distance: 0,
                delay: 300
            });
            sr.reveal(sectionId + " .section__link", {distance: 0});
        }

        switch (type) {
            case "js-section__home-collection":
                theme.layoutSlider(".js-layout-slider-" + id);
                theme.masonryLayout();
                theme.productCollSwatch();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .product-top", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__home-events":
                var thisEvents = $(".js-events-" + id);
                var thisSectionId = thisEvents.data("section-id");
                var thisApiKey = thisEvents.data("api-key");
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-event__item", {
                        interval: theme.intervalValue
                    });
                }
                //check if onboarding content exists
                if ($(section).find(".js-events-onboarding").length) {
                    theme.layoutSlider(".js-layout-slider-" + id);
                } else {
                    theme.eventFeed(
                        thisApiKey,
                        "#eventTemplate" + thisSectionId,
                        "#eventContainer" + thisSectionId,
                        thisSectionId
                    );
                }
                break;

            case "js-section__home-slider":
                //reset each youtube video object (weird YT re-init bug)
                section.find(".js-home-carousel-video-data").each(function () {
                    var playerId = $(this).attr("data-player-id");
                    window[playerId] = "undefined";
                });
                theme.homeMainCarousel();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-carousel", {distance: 0});
                }
                break;

            case "js-section__home-testimonials":
                theme.testimonialsCarousel();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-testimonials", {distance: 0});
                }
                break;

            case "js-section__home-image-grid":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-image-grid__item", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__home-logo-list":
                theme.logoCarousel();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-logo-list__items", {distance: 0});
                }
                break;

            case "js-section__home-video":
                theme.homeVideoGallery();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-video__stage, .home-video__items", {
                        distance: 0
                    });
                }
                break;

            case "js-section__home-blog":
                theme.masonryLayout();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .blog", {
                        delay: 500,
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__home-intro":
                theme.magnificVideo();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-intro", {distance: 0});
                    sr.reveal(
                        sectionId +
                        " .home-intro__media," +
                        sectionId +
                        " .home-intro__text," +
                        sectionId +
                        " .home-intro__video," +
                        sectionId +
                        " .home-intro__link-wrap"
                    );
                }
                break;

            case "js-section__home-promo":
                theme.magnificVideo();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-promo__box");
                }
                break;

            case "js-section__home-custom":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-custom__item", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__home-html":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-html", {distance: 0});
                }
                break;

            case "js-section__rich-text":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-rich-text__content", {distance: 0});
                }
                break;

            case "js-section__home-map":
                $(".js-map-replace").appendAround();
                theme.homeMaps();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-map__items");
                }
                break;

            case "js-section__home-delivery":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-delivery", {distance: 0});
                    sr.reveal(sectionId + " .home-delivery__content", {
                        distance: theme.intervalStyle
                    });
                }
                break;

            case "js-section__home-inline":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-inline__item", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__home-collection-list":
                theme.layoutSlider(".js-layout-slider-" + id);
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .collection-list__item", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__home-product":
                //check if onboarding
                if (
                    $(this)
                        .find(".section")
                        .attr("data-section-onboarding") != "true"
                ) {
                    theme.productSelect(id, "featured", false);
                }
                theme.selectWrapper();
                theme.runAjaxCart();
                theme.homeProductMediaInit();

                //slider images smooth loading
                $(".js-product-slider").hide();
                $(".js-product-slider-spinner").show();
                $(".js-product-slider").imagesLoaded(function () {
                    $(".js-product-slider").show();
                    $(".js-product-slider-spinner").hide();
                    theme.homeFeaturedProduct();
                });
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .product-featured__details", {distance: 0});
                    sr.reveal(sectionId + " .product-featured__photo-wrapper", {
                        distance: 0,
                        delay: 500
                    });
                }
                break;

            case "js-section__product-single":
                theme.selectWrapper();
                theme.accordion();
                theme.runAjaxCart();

                theme.productSelect("1", "single", true);
                theme.selectWrapper();
                theme.productMediaInit();

                //slider images smooth loading
                $(".js-product-slider").imagesLoaded(function () {
                    theme.thumbsCarousel();
                });

                //move cart box for classic layout
                $(".js-cart-replace").appendAround();

                if ($("body").data("anim-load")) {
                    sr.reveal(".product-single__title-text", {distance: "20px"});
                    sr.reveal(
                        ".product-single__title-desc, .breadcrumb, .product-single__photos, .product-single__content, .product-single--minimal .product-single__content-text",
                        {distance: 0, delay: 500}
                    );
                }
                break;

            case "js-section__product-testimonials":
                theme.testimonialsCarousel();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-testimonials", {distance: 0});
                }
                break;

            case "js-section__product-custom":
                if ($("body").data("anim-load")) {
                    sr.reveal(".home-custom__item", {interval: theme.intervalValue});
                    sr.reveal(".home-image-grid__item", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__product-related":
                theme.productRecommendations();
                break;

            case "js-section__blog":
                theme.masonryLayout();
                theme.layoutSlider(".js-layout-slider-" + id);
                theme.productCollSwatch();

                if ($("body").data("anim-load")) {
                    sr.reveal(".blog", {delay: 500, interval: theme.intervalValue});
                    sr.reveal(".blog-page__tags, .blog-pagination", {
                        distance: 0,
                        delay: 500
                    });
                    sr.reveal(".blog-page .section__title", {distance: "20px"});
                    sr.reveal(".product-top", {interval: theme.intervalValue});
                }
                break;

            case "js-section__article":
                theme.masonryLayout();
                theme.layoutSlider(".js-layout-slider-" + id);
                theme.productCollSwatch();

                if ($("body").data("anim-load")) {
                    sr.reveal(".article .section__title", {distance: "20px"});
                    sr.reveal(".article__date", {distance: "-10px", delay: 500});
                    sr.reveal(".article__featured-media, .article__content", {
                        distance: 0,
                        delay: 200
                    });
                    sr.reveal(".article__meta, .article-paginate", {distance: 0});
                    sr.reveal(".product-top", {interval: theme.intervalValue});
                }
                break;

            case "shopify-section-header js-section__header":
                theme.headerNav();
                theme.triggerActive();
                theme.localizeToggle();
                $(body).removeClass('header-down').removeClass('header-up');
                document.documentElement.style.setProperty('--header-height', document.getElementsByClassName('js-header')[0].offsetHeight + 'px');
                if ($('.js-header').hasClass('js-header-sticky')) {
                    stickybits(".js-section__header", {useStickyClasses: true});
                }
                theme.headerScrollUp();

                break;

            case "js-section__newsletter":
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .newsletter", {distance: 0});
                }
                break;

            case "js-section__footer":
                theme.footerTweet();
                theme.localizeToggle();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .newsletter", {distance: 0});
                }
                break;

            case "js-section__collection":
                theme.selectWrapper();
                theme.masonryLayout();
                theme.collectionSort();
                theme.collectionTagFilter();
                theme.productCollSwatch();

                if ($("body").data("anim-load")) {
                    sr.reveal(".collection__header-info__title", {distance: "20px"});
                    sr.reveal(".collection .product-top", {
                        interval: theme.intervalValue,
                        delay: 500
                    });
                    sr.reveal(
                        ".collection__header-media, .collection__header-info__text, .collection-main__sort, .collection-empty, .collection-pagination",
                        {distance: 0, delay: 500}
                    );
                }
                break;

            case "js-section__list-collections":
                if ($("body").data("anim-load")) {
                    sr.reveal(".list-collections .section__title", {distance: "20px"});
                    sr.reveal(".list-collections .collection-list__item", {
                        interval: theme.intervalValue,
                        delay: 500
                    });
                }
                break;

            case "js-section__mobile-draw":
                theme.triggerActive();
                theme.localizeToggle();
                break;

            case "js-section__promo-pop":
                if ($("body").data("anim-load")) {
                    sr.reveal(".promo-pop .section__title", {distance: 0});
                }
                break;

            case "js-section__faq-page":
                theme.accordion();
                theme.scrollToDiv();
                if ($("body").data("anim-load")) {
                    sr.reveal(".page .section__title", {distance: "20px"});
                    sr.reveal(".faq__cta", {distance: 0, delay: 500});
                    sr.reveal(".faq__search", {distance: 0, delay: 700});
                    sr.reveal(".faq__accordion", {distance: 0, delay: 900});
                    sr.reveal(".page__contact-form", {distance: 0, delay: 200});
                    sr.reveal(".faq__category__title", {distance: 0});
                }
                break;

            case "js-section__page-custom":
                if ($("body").data("anim-load")) {
                    sr.reveal(".home-custom__item", {interval: theme.intervalValue});
                    sr.reveal(".home-image-grid__item", {
                        interval: theme.intervalValue
                    });
                }
                break;

            case "js-section__page-contact":
                $(".js-map-replace").appendAround();
                theme.homeMaps();
                if ($("body").data("anim-load")) {
                    sr.reveal(sectionId + " .home-map__items");
                    sr.reveal(".page__contact-form", {distance: 0, delay: 200});
                }
                break;
        }
    })
    .on("shopify:section:reorder", function (event) {
        theme.homeSectionMargin();
    })
    .on("shopify:section:select", function (event) {
        var section = $(event.target);
        var type = section
            .attr("class")
            .replace("shopify-section", "")
            .trim();
        var id = event.originalEvent.detail.sectionId;

        switch (type) {
            case "js-section__mobile-draw":
                //record current top offset
                theme.currentOffset = $(document).scrollTop();
                theme.mfpOpen("menu-draw");
                break;

            case "js-section__age-checker":
                var ageEnabled = $(section)
                    .find(".js-age-draw")
                    .data("age-check-enabled");
                if (ageEnabled) {
                    theme.mfpOpen("age");
                } else {
                    $.magnificPopup.close();
                }
                //record current top offset
                theme.currentOffset = $(document).scrollTop();
                break;

            case "js-section__promo-pop":
                var promoEnabled = $(section)
                    .find(".js-promo-pop")
                    .data("promo-enabled");
                if (promoEnabled) {
                    theme.promoPop("open");
                } else {
                    theme.promoPop("close");
                }
                //record current top offset
                theme.currentOffset = $(document).scrollTop();
                break;

            case "js-section__home-slider":
                var currSlideshowSection = $('[data-section-id="' + id + '"]').find(
                    ".js-home-carousel"
                );
                //pause carousel autoplay
                currSlideshowSection.slick("slickPause");
                break;

            case "js-section__home-testimonials":
                var currTestimonialsSection = $('[data-section-id="' + id + '"]').find(
                    ".js-home-testimonials-carousel"
                );
                //pause carousel autoplay
                currTestimonialsSection.slick("slickPause");
                break;

            case "js-section__product-testimonials":
                var currProdTestimonialsSection = $(
                    '[data-section-id="' + id + '"]'
                ).find(".js-home-testimonials-carousel");
                //pause carousel autoplay
                currProdTestimonialsSection.slick("slickPause");
                break;
        }
    })
    .on("shopify:section:deselect", function (event) {
        var section = $(event.target);
        var type = section
            .attr("class")
            .replace("shopify-section", "")
            .trim();
        var id = event.originalEvent.detail.sectionId;

        switch (type) {
            case "js-section__mobile-draw":
                //jump back to to previous offset
                $(document).scrollTop(theme.currentOffset);
                $.magnificPopup.close();
                break;

            case "js-section__age-checker":
                //jump back to to previous offset
                $(document).scrollTop(theme.currentOffset);
                $.magnificPopup.close();
                break;

            case "js-section__promo-pop":
                theme.promoPop("close");
                //jump back to to previous offset
                $(document).scrollTop(theme.currentOffset);
                break;

            case "js-section__home-slider":
                var currSlideshowSection = $('[data-section-id="' + id + '"]').find(
                    ".js-home-carousel"
                );
                //play carousel autoplay
                if (currSlideshowSection.data("autoplay")) {
                    currSlideshowSection.slick("slickPlay");
                }
                break;

            case "js-section__home-testimonials":
                var currTestimonialsSection = $('[data-section-id="' + id + '"]').find(
                    ".js-home-testimonials-carousel"
                );
                //play carousel autoplay
                if (currTestimonialsSection.data("autoplay")) {
                    currTestimonialsSection.slick("slickPlay");
                }
                break;

            case "js-section__product-testimonials":
                var currProdTestimonialsSection = $(
                    '[data-section-id="' + id + '"]'
                ).find(".js-home-testimonials-carousel");
                //play carousel autoplay
                if (currProdTestimonialsSection.data("autoplay")) {
                    currProdTestimonialsSection.slick("slickPlay");
                }
                break;
        }
    })
    .on("shopify:block:select", function (event) {
        var id = event.originalEvent.detail.sectionId;
        var slide = $(event.target);
        var type = slide
            .parents(".shopify-section")
            .attr("class")
            .replace("shopify-section", "")
            .trim();

        switch (type) {
            case "js-section__home-slider":
                var currSlideshowSlide = $(slide)
                    .find(".home-carousel__item")
                    .attr("data-slide-id");
                var currSlideshowSlider = $('[data-section-id="' + id + '"]').find(
                    ".js-home-carousel"
                );
                //go to slide
                currSlideshowSlider.slick("slickGoTo", currSlideshowSlide);
                break;

            case "js-section__home-testimonials":
                var currTestimonialsSlide = $(slide)
                    .find(".home-testimonials__item")
                    .attr("data-slide-id");
                var currTestimonialsSlider = $('[data-section-id="' + id + '"]').find(
                    ".js-home-testimonials-carousel"
                );
                //go to slide
                currTestimonialsSlider.slick("slickGoTo", currTestimonialsSlide);
                break;

            case "js-section__product-testimonials":
                var currProdTestimonialsSlide = $(slide)
                    .find(".home-testimonials__item")
                    .attr("data-slide-id");
                var currProdTestimonialsSlider = $(
                    '[data-section-id="' + id + '"]'
                ).find(".js-home-testimonials-carousel");
                //go to slide
                currProdTestimonialsSlider.slick(
                    "slickGoTo",
                    currProdTestimonialsSlide
                );
                break;
        }
    });

/*============================================================================
  Money Format
  - Shopify.format money is defined in option_selection.js.
	If that file is not included, it is redefined here.
==============================================================================*/
if (typeof Shopify === "undefined") {
    Shopify = {};
}
if (!Shopify.formatMoney) {
    Shopify.formatMoney = function (cents, format) {
        var value = "",
            placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
            formatString = format || this.money_format;

        if (typeof cents == "string") {
            cents = cents.replace(".", "");
        }

        function defaultOption(opt, def) {
            return typeof opt == "undefined" ? def : opt;
        }

        function formatWithDelimiters(number, precision, thousands, decimal) {
            precision = defaultOption(precision, 2);
            thousands = defaultOption(thousands, ",");
            decimal = defaultOption(decimal, ".");

            if (isNaN(number) || number === null) {
                return 0;
            }

            number = (number / 100.0).toFixed(precision);

            var parts = number.split("."),
                dollars = parts[0].replace(
                    /(\d)(?=(\d\d\d)+(?!\d))/g,
                    "$1" + thousands
                ),
                cents = parts[1] ? decimal + parts[1] : "";

            return dollars + cents;
        }

        switch (formatString.match(placeholderRegex)[1]) {
            case "amount":
                value = formatWithDelimiters(cents, 2);
                break;
            case "amount_no_decimals":
                value = formatWithDelimiters(cents, 0);
                break;
            case "amount_with_comma_separator":
                value = formatWithDelimiters(cents, 2, ".", ",");
                break;
            case "amount_no_decimals_with_comma_separator":
                value = formatWithDelimiters(cents, 0, ".", ",");
                break;
        }

        return formatString.replace(placeholderRegex, value);
    };
}

/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */

(function detectIE() {
    var ieV;
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        ieV = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        document.querySelector('html').className += ' ie11';
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        ieV = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        document.querySelector('html').className += ' ie11';
    }

    // other browser
    return false;
})();
