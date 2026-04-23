            {configMode === "STANDARD" && (
              <form
                action={isRecurring ? handleCreateScopedPromo : saveSlotOverride}
                className="p-10 pt-4 space-y-6"
              >
                {isRecurring && (
                  <>
                    <input type="hidden" name="ruleType" value="RECURRING" />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                        Template Name
                      </label>
                      <input
                        name="name"
                        required
                        placeholder="e.g. Standard Recurring Rule"
                        className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 outline-none font-semibold"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2 mt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                      Selected Timeslots
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer mr-2">
                      <input type="checkbox" checked={isWholeDay} onChange={(e) => setIsWholeDay(e.target.checked)} className="peer rounded" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 peer-checked:opacity-100 peer-checked:text-brand-blue transition-all">Whole day</span>
                    </label>
                  </div>
                  {!isWholeDay ? (
                    <div className="grid grid-cols-6 gap-2">
                      {SLOT_TIMES.map((hour) => {
                        const isSelected = selectedRuleHours.includes(hour);
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              setSelectedRuleHours((prev) => {
                                if (prev.includes(hour)) return prev.filter((h) => h !== hour);
                                return [...prev, hour];
                              });
                            }}
                            className={cn(
                              "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center justify-center",
                              isSelected
                                ? "bg-brand-blue border-brand-blue text-brand-latte shadow-md shadow-brand-blue/30 scale-105 z-10 relative"
                                : "bg-brand-black/5 dark:bg-brand-latte/5 border-transparent opacity-50 hover:opacity-100"
                            )}
                          >
                            {hour > 12 ? hour - 12 : hour}
                            <span className="opacity-50 ml-0.5">{hour >= 12 ? "p" : "a"}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full py-4 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-brand-blue/20 text-center text-brand-blue text-xs font-black uppercase tracking-widest">
                       All 12 Timeslots Selected
                    </div>
                  )}
                  {isRecurring && (
                    <>
                      <input type="hidden" name="startHour" value={selectedRuleHours.length > 0 || isWholeDay ? (isWholeDay ? Math.min(...SLOT_TIMES) : Math.min(...selectedRuleHours)) : ""} />
                      <input type="hidden" name="endHour" value={selectedRuleHours.length > 0 || isWholeDay ? (isWholeDay ? Math.max(...SLOT_TIMES) + 1 : Math.max(...selectedRuleHours) + 1) : ""} />
                    </>
                  )}
                </div>
                
                {/* Visibility and Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        Visibility
                      </label>
                      <p className="text-[10px] font-bold opacity-30 uppercase">
                        Hide slot
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-90 origin-right">
                      <input
                        type="checkbox"
                        name="isActive"
                        value="true"
                        defaultChecked={true}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                  </div>
                  
                  <div className="p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name={isRecurring ? "discountPercent" : "discount"}
                      placeholder="0"
                      min="0"
                      max="100"
                      required={isRecurring}
                      className="w-full bg-transparent outline-none font-mono font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                    Backdrop Overlay
                  </label>
                  <div className="flex gap-2">
                    <label className="cursor-pointer flex-1">
                      <input type="radio" name="styleId" value="" checked={selectedBackdrop === ""} onChange={() => setSelectedBackdrop("")} className="hidden peer" />
                      <div className="py-3 text-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-white peer-checked:text-brand-blue dark:peer-checked:bg-[#111] transition-all text-xs font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                        Default
                      </div>
                    </label>
                    {["White", "Black", "Special"].map(type => {
                      const s = styles.find(st => st.type === type);
                      const keyId = s ? s.id : type;
                      return (
                        <label key={type} className="cursor-pointer flex-1">
                          {isRecurring ? (
                            <input type="radio" name="overrideBackdrop" value={type} checked={selectedBackdrop === type} onChange={() => setSelectedBackdrop(type)} className="hidden peer" />
                          ) : (
                            <input type="radio" name="styleId" value={keyId} checked={selectedBackdrop === keyId} onChange={() => setSelectedBackdrop(keyId)} className="hidden peer" />
                          )}
                          <div className="py-3 text-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                            {type}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {isRecurring && (
                    <input type="hidden" name="overrideIsActive" value="true" />
                  )}
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer ml-2">
                    <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-5 h-5 accent-brand-blue" />
                    <span className="text-sm font-black uppercase tracking-widest opacity-80">Make it recurring</span>
                  </label>

                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5 flex flex-col justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                          Days of Week
                        </label>
                        <div className="flex gap-1 h-12">
                          {[
                            { label: "S", val: 0 },
                            { label: "M", val: 1 },
                            { label: "T", val: 2 },
                            { label: "W", val: 3 },
                            { label: "T", val: 4 },
                            { label: "F", val: 5 },
                            { label: "S", val: 6 },
                          ].map((day) => (
                            <label
                              key={day.val}
                              className="cursor-pointer flex-1 h-full"
                            >
                              <input
                                type="checkbox"
                                name="daysOfWeek"
                                value={day.val}
                                className="hidden peer"
                              />
                              <div className="h-full flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-white transition-all text-xs font-black uppercase border border-transparent peer-checked:border-brand-blue">
                                <span className="opacity-60 peer-checked:opacity-100 text-brand-black dark:text-brand-latte peer-checked:text-white">
                                  {day.label}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                          Lifespan
                        </label>
                        <select
                          name="lifespan"
                          className="w-full h-12 px-4 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 font-bold text-sm tracking-widest uppercase outline-none appearance-none border border-transparent focus:border-brand-blue/50"
                        >
                          <option value="forever">Forever</option>
                          <option value="1_month">1 Month</option>
                          <option value="3_months">3 Months</option>
                          <option value="12_months">12 Months</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Inspector Widget Context check could go here if needed... */}

                <button
                  type="submit"
                  disabled={actionPending}
                  className="w-full py-6 mt-4 bg-brand-blue text-brand-latte font-black rounded-[2rem] shadow-2xl shadow-brand-blue/40 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-[0.2em]"
                >
                  {actionPending ? "Syncing..." : isRecurring ? "Create Template" : "Apply to Calendar"}
                </button>
              </form>
            )}
