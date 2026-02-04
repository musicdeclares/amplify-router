-- Change router_analytics.tour_id foreign key to SET NULL on delete.
-- Analytics rows should be preserved when a tour is deleted.
ALTER TABLE public.router_analytics
    DROP CONSTRAINT router_analytics_tour_id_fkey,
    ADD CONSTRAINT router_analytics_tour_id_fkey
        FOREIGN KEY (tour_id) REFERENCES public.router_tours(id) ON DELETE SET NULL;
