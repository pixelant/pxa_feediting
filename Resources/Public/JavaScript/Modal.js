/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

/**
 * Modal: TYPO3 Modal wrapper with predefined configurations per use case
 */
define([
    'jquery',
    'TYPO3/CMS/FrontendEditing/Utils/TranslatorLoader',
    'TYPO3/CMS/Backend/Modal',
    'TYPO3/CMS/Backend/Severity',
    './Utils/Logger'
], function ModalFactory (
    $,
    TranslatorLoader,
    Modal,
    Severity,
    loggers
) {
    'use strict';
    loggers.modal.trace('--> ModalFactory');

    var identifiers = Modal.identifiers || {
        modal: '.t3js-modal',
        content: '.t3js-modal-content',
        title: '.t3js-modal-title',
        close: '.t3js-modal-close',
        body: '.t3js-modal-body',
        footer: '.t3js-modal-footer',
        iframe: '.t3js-modal-iframe',
        iconPlaceholder: '.t3js-modal-icon-placeholder'
    };

    var translateKeys = {
        titleNavigate: 'title.navigate',
        discardLabel: 'button.discard_navigate',
        saveLabel: 'button.save',
        cancelLabel: 'button.cancel',
        okayLabel: 'button.okay',
        variableNotDefined: 'error.type.undefined',
        variableNotFunction: 'error.type.not_function',
        variableNotInteger: 'error.type.not_integer',
    };

    var translator = TranslatorLoader
        .useTranslator('modal', function reload (t) {
            translateKeys = $.extend(translateKeys, t.getKeys());
        }).translator;

    function translate () {
        return translator.translate.apply(translator, arguments);
    }

    var builder = {
        constraints: {
            'required': 1,
            'func': 2,
            'int': 4,
        },

        modal: createModalBuilder,
        button: createButtonBuilder,
    };

    function createModalBuilder (title, message) {
        loggers.modal.trace('--> builder.modal', title, message);
        loggers.modal.debug('start create modal');
        testConstraints(builder.constraints.required, title, 'title');
        testConstraints(builder.constraints.required, message, 'message');

        var handleEscape = true;
        var buttonClickListener, escapeListener, readyListener;

        loggers.modal.trace('<-- builder.modal');

        function attachEscapeListener (currentModal) {
            loggers.modal.trace('--> builder.modal.attachEscapeListener');
            var hasModalDismissed = false;
            function triggerEscapeEvent () {
                loggers.modal.trace('--> builder.modal.triggerEscapeEvent');
                loggers.modal.debug('escape modal', escapeListener);
                if (!hasModalDismissed && escapeListener) {
                    hasModalDismissed = true;
                    escapeListener();
                } else {
                    loggers.modal.debug('Unable to escape modal.');
                }
                loggers.modal.trace('<-- builder.modal.triggerEscapeEvent');
            }

            function preventTriggerEscape () {
                loggers.modal.trace('--> builder.modal.preventTriggerEscape');
                hasModalDismissed = true;
            }

            function handleBackdrop () {
                loggers.modal.trace('--> builder.modal.handleBackdrop');
                var targetInModelContent = false;
                currentModal.on('click', function backdropDismiss () {
                    if (targetInModelContent) {
                        targetInModelContent = false;
                    } else {
                        triggerEscapeEvent();
                        currentModal.trigger('modal-dismiss');
                    }
                });
                currentModal
                    .find('.modal-content')
                    .on('click', function preventClose (event) {
                        targetInModelContent = true;
                    });
                loggers.modal.trace('<-- builder.modal.handleBackdrop');
            }

            // handle escape by key
            currentModal.on('modal-dismiss', preventTriggerEscape);
            currentModal.on('hidden.bs.modal', triggerEscapeEvent);

            // handle escape by close button
            currentModal
                .find(identifiers.close)
                .on('click', triggerEscapeEvent);

            // handle escape by backdrop
            currentModal.on('shown.bs.modal', handleBackdrop);
            loggers.modal.trace('<-- builder.modal.attachEscapeListener');
        }

        return {
            title: title,
            content: message,
            severity: Severity.info,
            buttons: [],
            additionalCssClasses: ['t3-frontend-editing__modal'],

            translateTitle: function () {
                loggers.modal.trace('--> builder.modal.translateTitle');
                this.title = translate(this.title);
                loggers.modal.trace('<-- builder.modal.translateTitle');
                return this;
            },
            setSeverity: function (severity) {
                loggers.modal.trace('--> builder.modal.setSeverity(%s)', severity);
                testConstraints(builder.constraints.int, severity, 'severity');
                loggers.modal.trace('<-- builder.modal.setSeverity');
                this.severity = severity;
                return this;
            },
            onReady: function (listener) {
                loggers.modal.trace('--> builder.modal.onReady(%s)', listener);
                testConstraints(builder.constraints.func, listener, 'listener');
                // bad callback naming, callback if modal is ready
                /*eslint-disable-next-line id-denylist*/
                this.callback = listener;
                readyListener = listener;
                loggers.modal.trace('<-- builder.modal.onReady');
                return this;
            },
            onButtonClick: function (listener) {
                testConstraints(builder.constraints.func, listener, 'listener');
                buttonClickListener = listener;
                return this;
            },
            onEscape: function (listener) {
                loggers.modal.trace('--> builder.modal.onEscape', listener);
                testConstraints(builder.constraints.func, listener, 'listener');
                escapeListener = listener;
                loggers.modal.trace('<-- builder.modal.onEscape');
                return this;
            },
            preventEscape: function () {
                handleEscape = false;
                return this;
            },
            dismissOnButtonClick: function () {
                return this.onButtonClick(dismissModal);
            },
            prependButton: function (button) {
                return this.insertButton(0, button);
            },
            appendButton: function (button) {
                this.buttons.push(button);
                return this;
            },
            insertButton: function (index, button) {
                this.buttons.splice(index, 0, button);
                return this;
            },

            show: function () {
                loggers.modal.trace('--> builder.modal.show');
                loggers.modal.info('show modal ->', this.title);
                //copy ready listener cause it gets reset in next func
                var ready = readyListener;
                this.onReady(function prepareListeners (currentModal) {
                    if (!handleEscape) {
                        currentModal
                            .find(identifiers.close)
                            .hide();
                    }

                    if (buttonClickListener) {
                        currentModal.on('button.clicked', buttonClickListener);
                    }

                    if (ready) {
                        ready(currentModal);
                    }

                    loggers.modal.debug('create modal');
                    currentModal.modal({
                        keyboard: handleEscape,
                        backdrop: 'static',
                    });
                    if (handleEscape) {
                        attachEscapeListener(currentModal);
                    }
                });

                loggers.modal.debug('init modal');
                var modal = Modal.advanced(this);
                loggers.modal.trace('<-- builder.modal.show');
                return modal;
            }
        };
    }

    function createButtonBuilder (name) {
        return {
            text: name,
            name: name,
            active: false,

            setLabel: function (label, constraints) {
                testConstraints(constraints, label, 'label');
                this.text = label;
                return this;
            },
            translateLabel: function () {
                this.text = translate(this.text);
                testConstraints(
                    builder.constraints.required,
                    this.text,
                    'translate(this.text)'
                );
                return this;
            },
            setActive: function () {
                this.active = true;
                return this;
            },
            onClick: function (clickCallback, constraints) {
                testConstraints(constraints, clickCallback, 'clickCallback');
                this.trigger = clickCallback;
                return this;
            },
            setSeverity: function (severity) {
                testConstraints(builder.constraints.int, severity, 'severity');
                this.severity = severity;
                return this;
            },
            setVariant: function (variant) {
                this.variant = variant;
                return this;
            },

            get btnClass () {
                var btnClass = 'btn-';
                if (this.severity) {
                    btnClass += Severity.getCssClass(this.severity);
                } else {
                    btnClass += 'default';
                }
                if (this.variant) {
                    // add custom variant
                    btnClass += ' btn-' + this.variant;
                }
                return btnClass;
            },
        };
    }

    function testConstraints (constraints, variable, name) {
        if (!constraints) {
            return;
        }
        if ((constraints & builder.constraints.required) !== 0) {
            if (!variable) {
                throw new TypeError(
                    translate(translateKeys.variableNotDefined, name));
            }
        }
        if ((constraints & builder.constraints.func) !== 0) {
            if (variable && typeof variable !== 'function') {
                throw new TypeError(
                    translate(translateKeys.variableNotFunction, name));
            }
        }
        if ((constraints & builder.constraints.int) !== 0) {
            if (variable && !Number.isInteger(variable)) {
                //maybe to picky since it is only used as decision for design
                //razz (flood) sys-admin with warning would be better
                //TODO: log notice "errors" on server
                throw new TypeError(
                    translate(translateKeys.variableNotInteger, name));
            }
        }
    }

    // Simple modal close after button clicked
    function dismissModal () {
        $(this)
            .trigger('modal-dismiss');
    }

    function createBaseModal (title, message) {
        return builder.modal(title, message)
            .setSeverity(Severity.warning)
            .dismissOnButtonClick();
    }

    function createShowModal (title, message, callbacks) {
        return createBaseModal(title, message)
            .onEscape(callbacks.yes)
            .appendButton(
                builder.button(translateKeys.okayLabel)
                    .translateLabel()
                    .onClick(callbacks.yes)
                    .setActive()
            );
    }

    function createConfirmModal (title, message, callbacks) {
        return createShowModal(title, message, callbacks)
            .onEscape(callbacks.no)
            .prependButton(createCancelButton(callbacks.no));
    }

    function createCancelButton (clickListener) {
        return builder.button(translateKeys.cancelLabel)
            .translateLabel()
            .setActive()
            .setVariant('left')
            .onClick(clickListener);
    }

    loggers.modal.trace('<-- ModalFactory');
    return {
        /**
         * Simple modal builder which make modal much easier and more fun.
         */
        builder: builder,
        /**
         * Simple modal notification popup to annoy some users ... has to be an
         * important message - maybe written in uppercase. XD
         * @param message
         * @param callbacks
         */
        warning: function (message, callbacks) {
            loggers.modal.warn("warning with message", message);
            callbacks = callbacks || {};

            return createShowModal(message, message, callbacks)
                .show();
        },
        /**
         * Simple confirm to make non critical decisions
         * @param message
         * @param callbacks
         */
        confirm: function (message, callbacks) {
            callbacks = callbacks || {};

            return createConfirmModal(message, message, callbacks)
                .show();
        },
        /**
         * Confirm to leave page and lose data
         * @param message
         * @param saveCallback
         * @param callbacks
         */
        confirmNavigate: function (message, saveCallback, callbacks) {
            callbacks = callbacks || {};

            return createBaseModal(translateKeys.titleNavigate, message)
                .translateTitle()
                .preventEscape()
                .appendButton(createCancelButton(callbacks.no))
                .appendButton(
                    builder.button(translateKeys.saveLabel)
                        .translateLabel()
                        .onClick(saveCallback, builder.constraints.required)
                )
                .appendButton(
                    builder.button(translateKeys.discardLabel)
                        .translateLabel()
                        .onClick(callbacks.yes)
                        .setSeverity(Severity.error)
                )
                .show();
        },
    };
});
