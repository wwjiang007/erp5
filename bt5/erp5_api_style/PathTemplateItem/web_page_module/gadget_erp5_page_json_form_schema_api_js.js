/*global window, rJS, RSVP, domsugar, console*/
/*jslint nomen: true, indent: 2, maxerr: 3 */
(function (window, rJS, RSVP, domsugar, jIO) {
  "use strict";

  function submitDialog(gadget) {
    var form_gadget,
        button_container =
          gadget.element.querySelector('.dialog_button_container'),
        submit_input = button_container.querySelector('input');
    gadget.element.querySelector('.data-response')
      .classList.add("ui-screen-hidden");
    if (submit_input !== null) {
      submit_input.disabled = true;
    }
    function enableButton() {
      if (submit_input !== null) {
        submit_input.disabled = false;
      }
    }
    return gadget.notifySubmitting()
      .push(function () {
        return gadget.getDeclaredGadget("form_schema");
      })
      .push(function (result) {
        form_gadget = result;
        return form_gadget.checkValidity()
          .push(function (is_valid) {
            if (!is_valid) {
              enableButton();
              return gadget.notifySubmitted({
                "message": "Data is not Valid, please make sure no error is left.",
                "status": "failed"
              });
            }
            return form_gadget.getContent()
              .push(function (content_dict) {
                var json_data = content_dict.my_key,
                    status,
                    message;
                console.log(json_data);
                return sendContent(gadget, json_data)
                  .push(function (response) {
                    enableButton();
                    if (response.status >= 400) {
                      status = "fail";
                      message = JSON.parse(response.response).message;
                      return;
                    } else {
                      status = "success";
                      message = "Success";
                      return renderAPIResponse(
                        gadget, response.response
                      );
                    }
                  })
              .push(function () {
                    return gadget.notifySubmitted({
                      "message": message,
                      "status": status
                    });
                  });
              });
          });
      }, function (error) {
        enableButton();
        throw error;
      });
  }

  function sendContent(gadget, data) {
    var url = gadget.state.api_url,
        http_method;
    // XXX CLN Hakish
    //if (url.endsWith("/get/")) {
    //  http_method = "GET";
    //} else {
    http_method = "POST";
    //}
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({
          type: http_method,
          url: url,
          data: data
        });
      })
      .push(function (evt) {
        return evt.target;
      },  function (evt) {
        if (evt.target.status === 400) {
          return evt.target;
        }
        throw evt;
      });
  }

  function renderAPIResponse(gadget, data) {
    var element = gadget.element.querySelector('.data-response'),
        queue,
        response_gadget,
        data_schema,
        parsed_data;
    parsed_data = JSON.parse(data);
    data_schema = parsed_data.$schema;
    if (data_schema === undefined) {
      domsugar(
        gadget.element.querySelector('.data-response'),
        [domsugar("p", [domsugar("code", [domsugar("pre", [data])])])]
      );
      gadget.state.response = false;
      gadget.element.querySelector('.data-response')
        .classList.remove("ui-screen-hidden");
      return;
    }
    if ((!gadget.state.response)) {
      queue = gadget.declareGadget(
        rJS.getAbsoluteURL(
          "react-jsonschema-form-gadget.html",
          gadget.__path
        ),
        {scope: "response_form"}
      );
    } else {
      queue = gadget.getDeclaredGadget("response_form");
    }
    return queue
      .push(function (result) {
        response_gadget = result;
        return response_gadget.render({
          value: data,
          key: "my_key",
          schema: data_schema,
          readonly: true
        });
      })
      .push(function () {
        if ((!gadget.state.response)) {
          return response_gadget.getElement()
            .push(function (fragment) {
              // Clear first to DOM, append after to reduce flickering/manip
              while (element.firstChild) {
                element.removeChild(element.firstChild);
              }
              element.appendChild(fragment);
              gadget.state.response = true;
              gadget.element.querySelector('.data-response')
                .classList.remove("ui-screen-hidden");
            });
        }
        gadget.element.querySelector('.data-response')
          .classList.remove("ui-screen-hidden");
      });

  }

  rJS(window)
    /////////////////////////////////////////////////////////////////
    // Acquired methods
    /////////////////////////////////////////////////////////////////
    .allowPublicAcquisition('notifySubmit', function notifySubmit() {
      return this.triggerSubmit();
    })
    .declareAcquiredMethod("notifySubmitting", "notifySubmitting")
    .declareAcquiredMethod("notifySubmitted", "notifySubmitted")
    .declareAcquiredMethod("getUrlFor", "getUrlFor")
    .declareAcquiredMethod("getUrlForList", "getUrlForList")
    .declareAcquiredMethod("updateHeader", "updateHeader")

    /////////////////////////////////////////////////////////////////
    // declared methods
    /////////////////////////////////////////////////////////////////

    /** Render only transforms its arguments and passes them to mutex-protected onStateChange

    options:
      jio_key: {string} currently viewed document (e.g. foo/1)
      page: {string} selected page (always "tab" for page_tab)
      view: {string} always "view"
      selection, history, selection_index
    */
    .declareMethod("render", function (options) {
      return this.changeState({
        schema_url: options.schema_url,
        api_url: options.api_url,
        response: false
      });
    })
    .onStateChange(function (modification_dict) {
      var gadget = this,
        options = gadget.state.gadget,
        queue,
        json_schema_gadget;
      if ((!gadget.state.is_refresh)) {
        queue = gadget.declareGadget(
          rJS.getAbsoluteURL(
            "react-jsonschema-form-gadget.html",
            gadget.__path
          ),
          {scope: "form_schema"}
        );
      } else {
        queue = gadget.getDeclaredGadget("form_schema");
      }
      return queue
        .push(function (result) {
          json_schema_gadget = result;
          if (gadget.state.is_refresh) {
            // Delete the previous form content when refreshing
            // to prevent loosing user modification
            delete gadget.state.options.form_content;
          }
          return json_schema_gadget.render({
            value: "{}",
            key: "my_key",
            schema: gadget.state.schema_url
          });
        })
        .push(function () {
          if (true || (!gadget.state.is_refresh)) {
            return json_schema_gadget.getElement()
              .push(function (fragment) {
                var element = gadget.element
                  .querySelector('.form_container');
                // Clear first to DOM, append after to reduce flickering/manip
                while (element.firstChild) {
                  element.removeChild(element.firstChild);
                }
                element.appendChild(fragment);
              });
          }
        })
        .push(function () {
          var dom_list = [],
              response_display = gadget.element
                .querySelector('.data-response');
          dom_list.push(
            domsugar('input', {name: 'action_confirm',
                               class: 'dialogconfirm',
                               type: 'submit',
                               value: "Send"})
          );

          domsugar(gadget.element
                     .querySelector('.dialog_button_container'),
                   dom_list);
          response_display.classList.add("ui-screen-hidden");
          return gadget.getUrlFor({command: 'display', options: {
            page: "jio_api_action"
          }});
        })
        .push(function (return_url) {
          var update_kw = {
            page_title: "Send To API"
          };
          if (return_url !== undefined) {
            update_kw.back_url = return_url;
          }
          return gadget.updateHeader(update_kw);
        });
    })
    .onEvent('click', function click(evt) {
      if (evt.target.name === "action_confirm") {
        evt.preventDefault();
        return submitDialog(this);
      }
    }, false, false)
    .onEvent('submit', function submit() {
      return submitDialog(this);
    });

}(window, rJS, RSVP, domsugar, jIO));
