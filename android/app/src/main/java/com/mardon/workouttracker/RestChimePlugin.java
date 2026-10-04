package com.mardon.workouttracker;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Arms / disarms the one-shot rest-over chime. JS calls {@code schedule}
 * whenever the rest timer's end time changes and {@code cancel} when it is
 * skipped or dismissed; there is only ever one pending chime.
 */
@CapacitorPlugin(name = "RestChime")
public class RestChimePlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        Long at = call.getLong("at");
        if (at == null) {
            call.reject("at (epoch ms, integer) is required");
            return;
        }
        boolean headphonesOnly = call.getBoolean("headphonesOnly", true);
        RestChimeReceiver.schedule(getContext(), at, headphonesOnly);
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        RestChimeReceiver.cancel(getContext());
        call.resolve();
    }
}
