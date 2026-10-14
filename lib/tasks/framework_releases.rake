# frozen_string_literal: true

namespace :framework do
  namespace :releases do
    desc "Download every released css/js/zip this host lacks into storage/framework_releases (not committed)"
    task fetch: :environment do
      fetched = Framework::Releases.fetch
      puts "framework releases: fetched #{fetched.size} into #{Framework.releases_root}"
    end

    # The published bundle with one change: the one-line clamp's text width rounds like the room it is
    # compared with, as in 3.4.1. Every bundle from 2.3.7 to 3.4.0 measures it in exactly one place.
    desc "Write the clamp-fixed copy of plugins.min.js for every version Framework::Version::PATCHED_JS_VERSIONS lists"
    task patch_js: :environment do
      text_width = /Math\.ceil\((\w+\.getBoundingClientRect\(\)\.width\|\|0)\)/
      release_task = Framework::ReleaseTask.new(:patch)

      Framework::Version::PATCHED_JS_VERSIONS.each do |number|
        published = Framework::Releases.get("#{Framework::Releases.url}/js/#{number}/plugins.min.js").tap(&:value).body
        matches = published.scan(text_width).size
        raise "js/#{number}/plugins.min.js measures the one-line text width #{matches} times, expected 1" unless matches == 1

        target = Framework.public_root.join("js", number, Framework::Version::PATCHED_JS_FILE)
        target.dirname.mkpath
        target.binwrite(published.sub(text_width, 'Math.round(\1)'))
        release_task.send(:compress_siblings, target)
      end
    end
  end
end
