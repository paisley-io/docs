;; Create Actor Account for Recurring_Sub
(create-account 
  {
    :name "Recurring_Sub"
    :controller #133
  })

;; Deploy the complete subscription contract
(deploy 
 (do
   ;; Constants
   (def SECONDS_PER_DAY (* 24 60 60))
   (def MIN-INTERVAL (* 24 60 60))
   (def MAX-INTERVAL (* 365 24 60 60))
   (def MAX-AMOUNT 1000000000)
   (def MAX-RETRY-ATTEMPTS 3)
   (def GRACE-PERIOD (* 3 24 60 60))
   (def MAX-SUBSCRIPTIONS-PER-OWNER 100)
   (def REFUND_PROCESSORS (set [:approved-agent1 :approved-agent2]))
   (def CONTROLLER_ADDRESS 133)
   (def USAGE_THRESHOLD_PERCENT 80)

   ;; State
   (def subscriptions {})
   (def subscription-id-counter 0)
   (def plans {})
   (def plan-id-counter 0)
   (def owner-subscription-counts {})
   (def processing-lock false)
   (def refund-requests {})
   (def refund-id-counter 0)
   (def usage-metrics {})
   (def usage-id-counter 0)
   (def supported-tokens {})
   (def token-id-counter 0)

   ;; Token Management
   (defn add-supported-token [token-address decimals symbol]
     (assert (= *caller* CONTROLLER_ADDRESS) "Only controller can add tokens")
     (def token-id-counter (inc token-id-counter))
     (def supported-tokens 
       (assoc supported-tokens token-id-counter
              {:address token-address
               :decimals decimals
               :symbol symbol
               :status :active}))
     token-id-counter)

   ;; Usage Tracking
   (defn- create-usage-metric [subscription-id metric-type]
     (def usage-id-counter (inc usage-id-counter))
     (let [metric {:id usage-id-counter
                   :subscription-id subscription-id
                   :metric-type metric-type
                   :current-usage 0
                   :last-reset *timestamp*
                   :alerts-sent #{}}]
       (def usage-metrics 
         (assoc usage-metrics usage-id-counter metric))
       usage-id-counter))

(defn record-usage [subscription-id metric-type amount]
     (assert (get subscriptions subscription-id) "Subscription not found")
     (let [subscription (get subscriptions subscription-id)
           plan (get plans (:plan-id subscription))
           usage-id (or (first (filter #(let [entry %] (and (= (:subscription-id entry) subscription-id) (= (:metric-type entry) metric-type))) usage-metrics)) 
                 (create-usage-metric subscription-id metric-type))

           current-metric (get usage-metrics usage-id)
           new-usage (+ (:current-usage current-metric) amount)
           threshold (* (:usage-limit plan) (/ USAGE_THRESHOLD_PERCENT 100))]
       
       (def usage-metrics
         (assoc-in usage-metrics [usage-id :current-usage] new-usage))
       
       (when (and (> new-usage threshold)
                  (not (contains? (:alerts-sent current-metric) :threshold)))
         (def usage-metrics
           (update-in usage-metrics [usage-id :alerts-sent] conj :threshold))
         (log :USAGE-THRESHOLD-REACHED subscription-id metric-type new-usage))
       
       new-usage))

   (defn reset-usage-metrics [subscription-id]
     (doseq [[metric-id metric] usage-metrics]
       (when (= (:subscription-id metric) subscription-id)
         (def usage-metrics
           (-> usage-metrics
               (assoc-in [metric-id :current-usage] 0)
               (assoc-in [metric-id :last-reset] *timestamp*)
               (assoc-in [metric-id :alerts-sent] #{})))))
     true)

   ;; Plan Management
   (defn create-plan [name description amount interval trial-period token-id]
     (assert (get supported-tokens token-id) "Unsupported token")
     (assert (< (get owner-subscription-counts *caller* 0) MAX-SUBSCRIPTIONS-PER-OWNER) 
             "Too many subscriptions")
     (assert (and (string? name) (> (count name) 0)) "Invalid name")
     (assert (and (string? description) (> (count description) 0)) "Invalid description")
     (assert (> amount 0) "Amount must be positive")
     (assert (<= amount MAX-AMOUNT) "Amount exceeds maximum")
     (assert (>= interval MIN-INTERVAL) "Interval too short")
     (assert (<= interval MAX-INTERVAL) "Interval too long")
     (assert (>= trial-period 0) "Trial period cannot be negative")
     
     (def plan-id-counter (inc plan-id-counter))
     (let [plan {:id plan-id-counter
                 :owner *caller*
                 :name name
                 :description description
                 :base-amount amount
                 :interval interval
                 :trial-period trial-period
                 :token-id token-id
                 :usage-types #{:iot-stream :ai-compute}
                 :usage-limit 1000000
                 :usage-rate 0.001
                 :created-at *timestamp*
                 :status :active}]
       (def plans (assoc plans plan-id-counter plan))
       (log :PLAN-CREATED plan-id-counter *caller* name amount interval token-id)
       plan-id-counter))

   ;; Subscription Management
   (defn- generate-subscription-id []
     (def subscription-id-counter (inc subscription-id-counter))
     subscription-id-counter)

   (defn create-subscription [plan-id]
     (assert (get plans plan-id) "Plan not found")
     (assert (= (:status (get plans plan-id)) :active) "Plan not active")
     (let [plan (get plans plan-id)
           current-count (get owner-subscription-counts *caller* 0)]
       (assert (< current-count MAX-SUBSCRIPTIONS-PER-OWNER) 
               "Too many subscriptions")
       
       (let [subscription-id (generate-subscription-id)
             trial-end (when (> (:trial-period plan) 0)
                        (+ *timestamp* (:trial-period plan)))
             next-billing (if trial-end 
                           (+ trial-end (:interval plan))
                           (+ *timestamp* (:interval plan)))
             subscription {:id subscription-id
                          :owner *caller*
                          :plan-id plan-id
                          :amount (:base-amount plan)
                          :interval (:interval plan)
                          :trial-end trial-end
                          :next-billing-date next-billing
                          :status :active
                          :retry-count 0
                          :created-at *timestamp*
                          :updated-at *timestamp*
                          :last-processed nil}]
         
         (def subscriptions (assoc subscriptions subscription-id subscription))
         (def owner-subscription-counts 
           (assoc owner-subscription-counts *caller* (inc current-count)))
         (log :SUBSCRIPTION-CREATED subscription-id *caller* plan-id)
         subscription-id)))

   ;; Subscription Status Management
   (defn pause-subscription [subscription-id]
     (assert (get subscriptions subscription-id) "Subscription not found")
     (assert (= *caller* (:owner (get subscriptions subscription-id))) 
             "Not subscription owner")
     (let [subscription (get subscriptions subscription-id)]
       (assert (= (:status subscription) :active) "Subscription not active")
       (def subscriptions 
         (-> subscriptions
             (assoc-in [subscription-id :status] :paused)
             (assoc-in [subscription-id :updated-at] *timestamp*)))
       (log :SUBSCRIPTION-PAUSED subscription-id)
       true))

   (defn resume-subscription [subscription-id]
     (assert (get subscriptions subscription-id) "Subscription not found")
     (assert (= *caller* (:owner (get subscriptions subscription-id))) 
             "Not subscription owner")
     (let [subscription (get subscriptions subscription-id)]
       (assert (= (:status subscription) :paused) "Subscription not paused")
       (let [pause-duration (- *timestamp* (:updated-at subscription))
             new-next-billing (+ (:next-billing-date subscription) pause-duration)]
         (def subscriptions 
           (-> subscriptions
               (assoc-in [subscription-id :status] :active)
               (assoc-in [subscription-id :next-billing-date] new-next-billing)
               (assoc-in [subscription-id :updated-at] *timestamp*))))
       (log :SUBSCRIPTION-RESUMED subscription-id)
       true))

   (defn cancel-subscription [subscription-id]
     (assert (get subscriptions subscription-id) "Subscription not found")
     (assert (= *caller* (:owner (get subscriptions subscription-id))) 
             "Not subscription owner")
     (def subscriptions 
       (-> subscriptions
           (assoc-in [subscription-id :status] :cancelled)
           (assoc-in [subscription-id :updated-at] *timestamp*)))
     (def owner-subscription-counts 
       (update owner-subscription-counts *caller* dec))
     (log :SUBSCRIPTION-CANCELLED subscription-id)
     true)

   ;; Process Subscriptions and Payments
   (defn process-subscriptions []
     (assert (not processing-lock) "Processing already in progress")
     (def processing-lock true)
     (try
       (doseq [[subscription-id subscription] subscriptions]
         (when (and (= (:status subscription) :active)
                    (or (nil? (:last-processed subscription))
                        (> *timestamp* (:last-processed subscription)))
                    (>= *timestamp* (:next-billing-date subscription)))
           (when (or (nil? (:trial-end subscription))
                     (>= *timestamp* (:trial-end subscription)))
             (let [plan (get plans (:plan-id subscription))
                   token (get supported-tokens (:token-id plan))
                   usage-charges (reduce (fn [acc [metric-id metric]]
                                         (if (= (:subscription-id metric) subscription-id)
                                           (let [usage-cost (* (:current-usage metric) 
                                                             (:usage-rate plan))]
                                             (+ acc usage-cost))
                                           acc))
                                       0
                                       usage-metrics)
                   total-amount (+ (:base-amount subscription) usage-charges)]
               
               (try
                 (transfer (:address token) 
                          *address* 
                          (:owner subscription) 
                          total-amount)
                 
                 (def subscriptions 
                   (-> subscriptions
                       (assoc-in [subscription-id :next-billing-date] 
                                (+ (:next-billing-date subscription) 
                                   (:interval subscription)))
                       (assoc-in [subscription-id :last-processed] *timestamp*)
                       (assoc-in [subscription-id :retry-count] 0)))
                 
                 (reset-usage-metrics subscription-id)
                 
                 (log :SUBSCRIPTION-BILLED subscription-id total-amount)
                 (catch e
                   (let [retry-count (inc (:retry-count subscription 0))]
                     (if (>= retry-count MAX-RETRY-ATTEMPTS)
                       (do
                         (def subscriptions 
                           (-> subscriptions
                               (assoc-in [subscription-id :status] :payment-failed)
                               (assoc-in [subscription-id :updated-at] *timestamp*)))
                         (log :SUBSCRIPTION-FAILED subscription-id (str e)))
                       (do
                         (def subscriptions 
                           (-> subscriptions
                               (assoc-in [subscription-id :retry-count] retry-count)
                               (assoc-in [subscription-id :next-billing-date] 
                                        (+ *timestamp* GRACE-PERIOD))))
                         (log :BILLING-RETRY subscription-id retry-count (str e)))))))))))
       (finally
         (def processing-lock false))))

   ;; Query Functions
   (defn get-subscription [subscription-id]
     (get subscriptions subscription-id))

   (defn get-plan [plan-id]
     (get plans plan-id))

   (defn get-owner-subscriptions [owner]
     (filter #(= (:owner (second %)) owner) subscriptions))

   (defn get-subscription-status [subscription-id]
     (:status (get subscriptions subscription-id)))

   ;; Export all public functions
   (export 
     create-plan get-plan
     create-subscription pause-subscription resume-subscription
     cancel-subscription process-subscriptions
     get-subscription get-owner-subscriptions 
     get-subscription-status
     add-supported-token
     record-usage reset-usage-metrics)))



