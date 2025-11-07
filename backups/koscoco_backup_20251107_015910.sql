--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.votes DROP CONSTRAINT IF EXISTS votes_video_id_videos_id_fk;
ALTER TABLE IF EXISTS ONLY public.votes DROP CONSTRAINT IF EXISTS votes_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.videos DROP CONSTRAINT IF EXISTS videos_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.videos DROP CONSTRAINT IF EXISTS videos_phase_id_phases_id_fk;
ALTER TABLE IF EXISTS ONLY public.videos DROP CONSTRAINT IF EXISTS videos_category_id_categories_id_fk;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.referrals DROP CONSTRAINT IF EXISTS referrals_registration_id_registrations_id_fk;
ALTER TABLE IF EXISTS ONLY public.referrals DROP CONSTRAINT IF EXISTS referrals_affiliate_id_affiliates_id_fk;
ALTER TABLE IF EXISTS ONLY public.payout_requests DROP CONSTRAINT IF EXISTS payout_requests_processed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.payout_requests DROP CONSTRAINT IF EXISTS payout_requests_affiliate_id_fkey;
ALTER TABLE IF EXISTS ONLY public.judge_scores DROP CONSTRAINT IF EXISTS judge_scores_video_id_videos_id_fk;
ALTER TABLE IF EXISTS ONLY public.judge_scores DROP CONSTRAINT IF EXISTS judge_scores_judge_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.affiliates DROP CONSTRAINT IF EXISTS affiliates_user_id_users_id_fk;
DROP INDEX IF EXISTS public.users_username_unique;
DROP INDEX IF EXISTS public.users_google_id_unique;
DROP INDEX IF EXISTS public.users_facebook_id_unique;
DROP INDEX IF EXISTS public.unique_vote_user;
DROP INDEX IF EXISTS public.unique_vote_ip;
DROP INDEX IF EXISTS public.unique_judge_video_score;
DROP INDEX IF EXISTS public.idx_votes_video_id;
DROP INDEX IF EXISTS public.idx_judge_scores_video_id;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.votes DROP CONSTRAINT IF EXISTS votes_pkey;
ALTER TABLE IF EXISTS ONLY public.videos DROP CONSTRAINT IF EXISTS videos_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.referrals DROP CONSTRAINT IF EXISTS referrals_pkey;
ALTER TABLE IF EXISTS ONLY public.phases DROP CONSTRAINT IF EXISTS phases_pkey;
ALTER TABLE IF EXISTS ONLY public.phases DROP CONSTRAINT IF EXISTS phases_number_unique;
ALTER TABLE IF EXISTS ONLY public.phases DROP CONSTRAINT IF EXISTS phases_name_unique;
ALTER TABLE IF EXISTS ONLY public.payout_requests DROP CONSTRAINT IF EXISTS payout_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.judge_scores DROP CONSTRAINT IF EXISTS judge_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_name_unique;
ALTER TABLE IF EXISTS ONLY public.affiliates DROP CONSTRAINT IF EXISTS affiliates_referral_code_unique;
ALTER TABLE IF EXISTS ONLY public.affiliates DROP CONSTRAINT IF EXISTS affiliates_pkey;
DROP TABLE IF EXISTS public.votes;
DROP TABLE IF EXISTS public.videos;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.registrations;
DROP TABLE IF EXISTS public.referrals;
DROP TABLE IF EXISTS public.phases;
DROP TABLE IF EXISTS public.payout_requests;
DROP TABLE IF EXISTS public.judge_scores;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.affiliates;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    referral_code text NOT NULL,
    total_referrals integer DEFAULT 0 NOT NULL,
    total_earnings integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    subcategories text[] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: judge_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.judge_scores (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    video_id character varying NOT NULL,
    judge_id character varying NOT NULL,
    creativity_score integer NOT NULL,
    quality_score integer NOT NULL,
    comments text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payout_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id character varying NOT NULL,
    amount integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text NOT NULL,
    account_details text NOT NULL,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone,
    processed_by character varying,
    rejection_reason text
);


--
-- Name: phases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phases (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    number integer NOT NULL,
    status text DEFAULT 'upcoming'::text NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id character varying NOT NULL,
    registration_id character varying NOT NULL,
    commission integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    category_ids text[] NOT NULL,
    total_fee integer NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    referral_code text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    profile_image_url character varying,
    age integer,
    location text,
    parental_consent boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    password character varying,
    username character varying,
    google_id character varying,
    facebook_id character varying,
    reset_password_token character varying,
    reset_password_expires timestamp without time zone,
    email_verified boolean DEFAULT false,
    verification_token character varying,
    verification_token_expiry timestamp without time zone
);


--
-- Name: videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.videos (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    category_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text,
    duration integer NOT NULL,
    file_size integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    subcategory text NOT NULL,
    phase_id character varying
);


--
-- Name: votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.votes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    video_id character varying NOT NULL,
    user_id character varying,
    ip_address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: affiliates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.affiliates (id, user_id, referral_code, total_referrals, total_earnings, status, created_at) FROM stdin;
bdffd639-c1c0-4855-884e-d4a77278fedc	80fb355f-70a3-44b7-99d4-22ccd016e0ed	REF-80FB355F	0	0	active	2025-11-02 10:05:17.675713
4f65371f-4ae9-4f44-a1c7-835ae3e32713	63a90613-cc89-459a-b76d-e05e034d6395	TESTREF123	2	10000	active	2025-11-04 18:17:28.866866
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, subcategories, created_at) FROM stdin;
1e6cb5da-45b3-461e-be83-ba82623a9b54	Music & Dance	Showcase your musical and dance talents	{Singing,Dancing}	2025-11-02 04:14:22.354832
8fb64e6b-00e9-4e87-a272-22d3a0eacd81	Comedy & Performing Arts	Make us laugh and entertain	{Skits,Stand-up,Monologue,Acting,"Movie content"}	2025-11-02 04:14:22.354832
b5f86ff9-1b98-4922-933f-fb01aa74ed11	Fashion & Lifestyle	Share your style and lifestyle content	{Cooking,Events,Decor,Sports,Travel,Vlogging,Fashion,Hair,Makeup,Beauty,Reviews}	2025-11-02 04:14:22.354832
5a3e054e-8d4f-41f9-8a19-ea0d791e5f7e	Education & Learning	Educate and inspire through your content	{DIY,Tutorials,Documentary,"Business & Finance",News,"Motivational Speaking"}	2025-11-02 04:14:22.354832
ddb64b87-6140-4d51-9919-ef0e741b8955	Gospel Choirs	Share gospel music and choir performances	{Acapella,"Choir Music"}	2025-11-02 04:14:22.354832
\.


--
-- Data for Name: judge_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.judge_scores (id, video_id, judge_id, creativity_score, quality_score, comments, created_at) FROM stdin;
\.


--
-- Data for Name: payout_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout_requests (id, affiliate_id, amount, status, payment_method, account_details, requested_at, processed_at, processed_by, rejection_reason) FROM stdin;
\.


--
-- Data for Name: phases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phases (id, name, description, number, status, start_date, end_date, created_at) FROM stdin;
f26a0e79-6d47-419e-8033-e4359d438031	TOP 100	Initial submissions	1	active	\N	\N	2025-11-02 04:14:23.873629
8c1e1fbc-d8b5-4fb4-8e9c-7a096f001012	TOP 50	Top performers advance	2	upcoming	\N	\N	2025-11-02 04:14:23.873629
1c55be52-f992-4077-a2f4-299d584973ed	TOP 10	Final selections	3	upcoming	\N	\N	2025-11-02 04:14:23.873629
2fa8ac20-d27b-4891-9263-ca36fd231c2c	TOP 3	Category winners	4	upcoming	\N	\N	2025-11-02 04:14:23.873629
a9557b59-7478-4c2b-b537-2a312e875620	GRAND FINALE	Ultimate winner	5	upcoming	\N	\N	2025-11-02 04:14:23.873629
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (id, affiliate_id, registration_id, commission, status, created_at) FROM stdin;
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registrations (id, user_id, category_ids, total_fee, payment_status, referral_code, created_at) FROM stdin;
c1a38376-7df6-42a1-8243-ed2d8424a36c	80fb355f-70a3-44b7-99d4-22ccd016e0ed	{b5f86ff9-1b98-4922-933f-fb01aa74ed11,5a3e054e-8d4f-41f9-8a19-ea0d791e5f7e}	5000	pending	\N	2025-11-02 20:55:38.930407
a1e869e8-c5b2-4430-98e7-b35b93abe444	80fb355f-70a3-44b7-99d4-22ccd016e0ed	{1e6cb5da-45b3-461e-be83-ba82623a9b54,ddb64b87-6140-4d51-9919-ef0e741b8955}	5000	pending	\N	2025-11-04 19:24:59.034243
b49d7f10-4f8f-4676-84bc-30fb11a2f9d5	80fb355f-70a3-44b7-99d4-22ccd016e0ed	{1e6cb5da-45b3-461e-be83-ba82623a9b54,8fb64e6b-00e9-4e87-a272-22d3a0eacd81}	5000	completed	\N	2025-11-02 20:54:43.961288
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
HghAtwWC6UAqlt9Kjm1HZ7CZKX5rugj7	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-09T10:00:54.502Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "80fb355f-70a3-44b7-99d4-22ccd016e0ed"}}	2025-11-09 12:52:33
GUZFmSMMNYsqoUm34WUTzUgaQWMSvDQu	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-09T09:50:58.999Z", "httpOnly": true, "originalMaxAge": 604799999}, "passport": {"user": "25528c3c-d7a1-43e1-a908-ac37563ff5aa"}}	2025-11-09 09:51:02
onzcJZf0p7vAPUZEuo3OoDtMefPszA8-	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-09T08:32:34.127Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-09 08:32:35
9FwpH2zZlw_2ZI0Ug6sBQ0moKLV_ehAP	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-09T09:46:10.334Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "cdc9fd37-f216-473e-b8d8-abc9bd3ca39e"}}	2025-11-09 09:46:14
3Q3EfFaB4IRq-hGd0CNZTq-mGdDLHZby	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-14T01:37:08.949Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "80fb355f-70a3-44b7-99d4-22ccd016e0ed"}}	2025-11-14 01:59:12
oUt-P8UXR_yODybtW7cTZ9XFh_UJVeNi	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-11T23:27:52.596Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "99cfe7d1-6e59-484c-8385-9739ad7a185b"}}	2025-11-11 23:27:54
yw-22Wb5UHgZdFES5CSsfIa0YfKtX8zF	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-09T20:53:45.520Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "80fb355f-70a3-44b7-99d4-22ccd016e0ed"}}	2025-11-09 20:57:38
gK1sIXZOVWrDOblczAE1MPo1W0ZH4tx4	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-11T23:32:46.058Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-11-11 23:32:47
ZM5YCnOvoKyTpm5Yt3vonB7A4MxD8zyd	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-11T19:14:05.933Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "80fb355f-70a3-44b7-99d4-22ccd016e0ed"}}	2025-11-12 14:14:38
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, first_name, last_name, profile_image_url, age, location, parental_consent, is_admin, created_at, updated_at, password, username, google_id, facebook_id, reset_password_token, reset_password_expires, email_verified, verification_token, verification_token_expiry) FROM stdin;
5742d670-cbc3-4f0e-b250-b4f27742b57a	9TC6p-Xt@example.com	Test	User	\N	25	\N	f	f	2025-11-02 08:31:48.42018	2025-11-02 08:31:48.42018	$2b$10$noxwaKRaFQHU80mZ3wrIVOWF9YFnow7waA3OL/dO7MKWJyY7kuoIW	\N	\N	\N	\N	\N	f	\N	\N
test-reset-user	resettest@example.com	Test	User	\N	\N	\N	f	f	2025-11-02 09:21:07.83241	2025-11-02 09:21:19.775	$2b$10$lRDUadafJwfgEUgxSu7eg.b4.dF8Mo3DP574q1qaAnS0u7qXRUTKi	resettest	\N	\N	\N	\N	f	\N	\N
cdc9fd37-f216-473e-b8d8-abc9bd3ca39e	testuser@example.com	Test	User	\N	25	\N	f	f	2025-11-02 09:46:07.697177	2025-11-02 09:46:07.697177	$2b$10$DCEQpsOdPrTOLjYDVqh/weF6VJwSnqJDA8jXtLHM1UwRsBOWFBJvK	\N	\N	\N	\N	\N	f	\N	\N
25528c3c-d7a1-43e1-a908-ac37563ff5aa	testuser_rHotY0@example.com	Test	User	\N	25	\N	f	f	2025-11-02 09:50:58.424982	2025-11-02 09:50:58.424982	$2b$10$aFHLHukfpG5tx0uF6RWkA.4vTf0QesPtLuawpu6j6twL8bxR6zFsO	\N	\N	\N	\N	\N	f	\N	\N
80fb355f-70a3-44b7-99d4-22ccd016e0ed	johnracoon2018@gmail.com	John 	Racoon	\N	40	\N	f	f	2025-11-02 10:00:54.330086	2025-11-02 10:00:54.330086	$2b$10$lG8ihQo05OzFZa6awFx2yuh2OKmZNb.E.EGY3talpr5HRV1DYB/yK	\N	\N	\N	\N	\N	f	\N	\N
63a90613-cc89-459a-b76d-e05e034d6395	affiliate@test.com	Test	Affiliate	\N	\N	\N	f	f	2025-11-04 18:17:28.795179	2025-11-04 18:17:28.795179	$2a$10$test	testaffiliate	\N	\N	\N	\N	f	\N	\N
99cfe7d1-6e59-484c-8385-9739ad7a185b	testloginENLCf1@example.com	Test	User	\N	25	\N	f	f	2025-11-04 23:26:13.697276	2025-11-04 23:26:13.697276	$2b$10$UdZieTh/.gtF/k5foJz3nOiAAQIncAfweS5nAkJ3ZJMaeuCzmdROq	\N	\N	\N	\N	\N	f	54df3712c89b1ebadc6b595a8d800b6dcf87bcef9f5ecf8b4e1bda5b5743059f	2025-11-05 23:26:13.661
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.videos (id, user_id, category_id, title, description, video_url, thumbnail_url, duration, file_size, status, views, created_at, updated_at, subcategory, phase_id) FROM stdin;
\.


--
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.votes (id, video_id, user_id, ip_address, created_at) FROM stdin;
\.


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_referral_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_referral_code_unique UNIQUE (referral_code);


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: judge_scores judge_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.judge_scores
    ADD CONSTRAINT judge_scores_pkey PRIMARY KEY (id);


--
-- Name: payout_requests payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);


--
-- Name: phases phases_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phases
    ADD CONSTRAINT phases_name_unique UNIQUE (name);


--
-- Name: phases phases_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phases
    ADD CONSTRAINT phases_number_unique UNIQUE (number);


--
-- Name: phases phases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phases
    ADD CONSTRAINT phases_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_judge_scores_video_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_judge_scores_video_id ON public.judge_scores USING btree (video_id);


--
-- Name: idx_votes_video_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_votes_video_id ON public.votes USING btree (video_id);


--
-- Name: unique_judge_video_score; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_judge_video_score ON public.judge_scores USING btree (video_id, judge_id);


--
-- Name: unique_vote_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_vote_ip ON public.votes USING btree (video_id, ip_address) WHERE (ip_address IS NOT NULL);


--
-- Name: unique_vote_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_vote_user ON public.votes USING btree (video_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: users_facebook_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_facebook_id_unique ON public.users USING btree (facebook_id) WHERE (facebook_id IS NOT NULL);


--
-- Name: users_google_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_google_id_unique ON public.users USING btree (google_id) WHERE (google_id IS NOT NULL);


--
-- Name: users_username_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: affiliates affiliates_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: judge_scores judge_scores_judge_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.judge_scores
    ADD CONSTRAINT judge_scores_judge_id_users_id_fk FOREIGN KEY (judge_id) REFERENCES public.users(id);


--
-- Name: judge_scores judge_scores_video_id_videos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.judge_scores
    ADD CONSTRAINT judge_scores_video_id_videos_id_fk FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- Name: payout_requests payout_requests_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id);


--
-- Name: payout_requests payout_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: referrals referrals_affiliate_id_affiliates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_affiliate_id_affiliates_id_fk FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id);


--
-- Name: referrals referrals_registration_id_registrations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_registration_id_registrations_id_fk FOREIGN KEY (registration_id) REFERENCES public.registrations(id);


--
-- Name: registrations registrations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: videos videos_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: videos videos_phase_id_phases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_phase_id_phases_id_fk FOREIGN KEY (phase_id) REFERENCES public.phases(id);


--
-- Name: videos videos_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: votes votes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: votes votes_video_id_videos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_video_id_videos_id_fk FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- PostgreSQL database dump complete
--

